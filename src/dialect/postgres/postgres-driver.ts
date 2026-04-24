import type {
  ControlConnectionProvider,
  DatabaseConnection,
  QueryResult,
} from '../../driver/database-connection.js'
import type { Driver, TransactionSettings } from '../../driver/driver.js'
import { parseSavepointCommand } from '../../parser/savepoint-parser.js'
import { CompiledQuery } from '../../query-compiler/compiled-query.js'
import type { QueryCompiler } from '../../query-compiler/query-compiler.js'
import type {
  AbortableOperationOptions,
  AbortableQueryOptions,
} from '../../util/abort.js'
import { isFunction, freeze } from '../../util/object-utils.js'
import { createQueryId, type QueryId } from '../../util/query-id.js'
import { extendStackTrace } from '../../util/stack-trace-utils.js'
import type {
  PostgresClientConstructor,
  PostgresCursorConstructor,
  PostgresDialectConfig,
  PostgresPool,
  PostgresPoolClient,
} from './postgres-dialect-config.js'

const PRIVATE_RELEASE_METHOD: unique symbol = Symbol()

export class PostgresDriver implements Driver {
  readonly #config: PostgresDialectConfig
  readonly #connections = new WeakMap<PostgresPoolClient, DatabaseConnection>()
  #pool?: PostgresPool

  constructor(config: PostgresDialectConfig) {
    this.#config = freeze({ ...config })
  }

  async init(options?: AbortableOperationOptions): Promise<void> {
    this.#pool = isFunction(this.#config.pool)
      ? await this.#config.pool(options)
      : this.#config.pool
  }

  async acquireConnection(
    options?: AbortableOperationOptions,
  ): Promise<DatabaseConnection> {
    const client = await this.#pool!.connect()

    let connection = this.#connections.get(client)

    if (!connection) {
      connection = new PostgresConnection(client, {
        controlClient: this.#config.controlClient || this.#pool!.Client,
        cursor: this.#config.cursor ?? null,
        poolOptions: this.#pool!.options,
      })
      this.#connections.set(client, connection)

      // The driver must take care of calling `onCreateConnection` when a new
      // connection is created. The `pg` module doesn't provide an async hook
      // for the connection creation. We need to call the method explicitly.
      if (this.#config.onCreateConnection) {
        await this.#config.onCreateConnection(connection, options)
      }
    }

    if (this.#config.onReserveConnection) {
      await this.#config.onReserveConnection(connection, options)
    }

    return connection
  }

  async beginTransaction(
    connection: DatabaseConnection,
    settings: TransactionSettings,
  ): Promise<void> {
    let sql = 'begin'

    if (settings.isolationLevel || settings.accessMode) {
      sql = 'start transaction'

      if (settings.isolationLevel) {
        sql += ` isolation level ${settings.isolationLevel}`
      }

      if (settings.accessMode) {
        sql += ` ${settings.accessMode}`
      }
    }

    await connection.executeQuery(CompiledQuery.raw(sql))
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('commit'))
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('rollback'))
  }

  async savepoint(
    connection: DatabaseConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
  ): Promise<void> {
    await connection.executeQuery(
      compileQuery(
        parseSavepointCommand('savepoint', savepointName),
        createQueryId(),
      ),
    )
  }

  async rollbackToSavepoint(
    connection: DatabaseConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
  ): Promise<void> {
    await connection.executeQuery(
      compileQuery(
        parseSavepointCommand('rollback to', savepointName),
        createQueryId(),
      ),
    )
  }

  async releaseSavepoint(
    connection: DatabaseConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
  ): Promise<void> {
    await connection.executeQuery(
      compileQuery(
        parseSavepointCommand('release', savepointName),
        createQueryId(),
      ),
    )
  }

  async releaseConnection(connection: PostgresConnection): Promise<void> {
    connection[PRIVATE_RELEASE_METHOD]()
  }

  async destroy(): Promise<void> {
    if (this.#pool) {
      const pool = this.#pool
      this.#pool = undefined
      await pool.end()
    }
  }
}

interface PostgresConnectionOptions {
  controlClient?: PostgresClientConstructor
  cursor: PostgresCursorConstructor | null
  poolOptions: object
}

class PostgresConnection implements DatabaseConnection {
  readonly #client: PostgresPoolClient
  readonly #options: PostgresConnectionOptions
  #queryId?: QueryId
  #pid?: number

  constructor(client: PostgresPoolClient, options: PostgresConnectionOptions) {
    this.#client = client
    this.#options = options
  }

  async cancelQuery(
    controlConnectionProvider: ControlConnectionProvider,
  ): Promise<void> {
    return await this.#executeControlQuery(
      `select pg_cancel_backend(${this.#pid})`,
      controlConnectionProvider,
    )
  }

  async collectSessionInfo(): Promise<void> {
    if (this.#pid) {
      return
    }

    const { processID } = this.#client

    // `processID` is an undocumented member of the `Client` class.
    // it might not exist in old or future versions of the `pg` driver.
    // if it does, use it.
    if (processID) {
      this.#pid = processID
    } else {
      const {
        rows: [{ pid }],
      } = await this.#client.query<{ pid: string }>(
        'select pg_backend_pid() as pid',
        [],
      )

      this.#pid = Number(pid)
    }
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    try {
      // this helps ensure we don't cancel the wrong query when aborted.
      this.#queryId = compiledQuery.queryId

      const result = await this.#client.query<O>(
        compiledQuery.sql,
        compiledQuery.parameters,
      )

      const { command, rowCount, rows } = result

      return {
        numAffectedRows:
          command === 'INSERT' ||
          command === 'UPDATE' ||
          command === 'DELETE' ||
          command === 'MERGE'
            ? BigInt(rowCount)
            : undefined,
        rows: rows ?? [],
      }
    } catch (err) {
      throw extendStackTrace(err, new Error())
    } finally {
      // this tells cancellation the query is no longer relevant.
      this.#queryId = undefined
    }
  }

  async killSession(
    controlConnectionProvider: ControlConnectionProvider,
  ): Promise<void> {
    return await this.#executeControlQuery(
      `select pg_terminate_backend(${this.#pid})`,
      controlConnectionProvider,
    )
  }

  async *streamQuery<O>(
    compiledQuery: CompiledQuery,
    chunkSize: number,
  ): AsyncIterableIterator<QueryResult<O>> {
    if (!this.#options.cursor) {
      throw new Error(
        "`cursor` is not present in your postgres dialect config. It's required to make streaming work in postgres.",
      )
    }

    // this helps ensure we don't cancel the wrong query when aborted.
    this.#queryId = compiledQuery.queryId

    const cursor = this.#client.query(
      new this.#options.cursor<O>(
        compiledQuery.sql,
        compiledQuery.parameters.slice(),
      ),
    )

    try {
      while (true) {
        const rows = await cursor.read(chunkSize)

        if (rows.length === 0) {
          break
        }

        yield {
          rows,
        }
      }
    } finally {
      await cursor.close()
      // this tells cancellation the query is no longer relevant.
      this.#queryId = undefined
    }
  }

  [PRIVATE_RELEASE_METHOD](): void {
    this.#client.release()
  }

  async #executeControlQuery(
    query: string,
    controlConnectionProvider: ControlConnectionProvider,
  ): Promise<void> {
    if (!this.#queryId) {
      return
    }

    const { controlClient: Client, poolOptions } = this.#options

    const queryIdToCancel = this.#queryId

    // we fallback to a pool connection, and execute a SQL query to cancel the
    // query. this is not ideal, as we might have to wait for an idle connection.
    if (!Client) {
      return await controlConnectionProvider(async (controlConnection) => {
        // by the time we get the connection, another query might have been executed.
        // we need to ensure we're not canceling the wrong query.
        if (queryIdToCancel.queryId === this.#queryId?.queryId) {
          await controlConnection.executeQuery(CompiledQuery.raw(query, []))
        }
      })
    }

    const controlClient = new Client({ ...poolOptions })

    try {
      await controlClient.connect()

      // by the time we get the connection, another query might have been executed.
      // we need to ensure we're not canceling the wrong query.
      if (queryIdToCancel.queryId !== this.#queryId.queryId) {
        return
      }

      await controlClient.query(query, [])
    } finally {
      controlClient.end()
    }
  }
}
