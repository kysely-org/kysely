import {
  ControlConnectionProvider,
  DatabaseConnection,
  QueryResult,
} from '../../driver/database-connection.js'
import { Driver, TransactionSettings } from '../../driver/driver.js'
import { parseSavepointCommand } from '../../parser/savepoint-parser.js'
import { CompiledQuery } from '../../query-compiler/compiled-query.js'
import { QueryCompiler } from '../../query-compiler/query-compiler.js'
import { ExecuteQueryOptions } from '../../query-executor/query-executor.js'
import { isFunction, freeze } from '../../util/object-utils.js'
import { createQueryId, QueryId } from '../../util/query-id.js'
import { extendStackTrace } from '../../util/stack-trace-utils.js'
import {
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

  async init(options?: ExecuteQueryOptions): Promise<void> {
    this.#pool = isFunction(this.#config.pool)
      ? await this.#config.pool(options)
      : this.#config.pool
  }

  async acquireConnection(
    options?: ExecuteQueryOptions,
  ): Promise<DatabaseConnection> {
    const client = await this.#pool!.connect()
    let connection = this.#connections.get(client)

    if (!connection) {
      connection = new PostgresConnection(client, {
        Client: this.#config.controlClient || this.#pool!.Client,
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
    options?: ExecuteQueryOptions,
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

    await connection.executeQuery(CompiledQuery.raw(sql), options)
  }

  async commitTransaction(
    connection: DatabaseConnection,
    options?: ExecuteQueryOptions,
  ): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('commit'), options)
  }

  async rollbackTransaction(
    connection: DatabaseConnection,
    options?: ExecuteQueryOptions,
  ): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('rollback'), options)
  }

  async savepoint(
    connection: DatabaseConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
    options?: ExecuteQueryOptions,
  ): Promise<void> {
    await connection.executeQuery(
      compileQuery(
        parseSavepointCommand('savepoint', savepointName),
        createQueryId(),
      ),
      options,
    )
  }

  async rollbackToSavepoint(
    connection: DatabaseConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
    options?: ExecuteQueryOptions,
  ): Promise<void> {
    await connection.executeQuery(
      compileQuery(
        parseSavepointCommand('rollback to', savepointName),
        createQueryId(),
      ),
      options,
    )
  }

  async releaseSavepoint(
    connection: DatabaseConnection,
    savepointName: string,
    compileQuery: QueryCompiler['compileQuery'],
    options?: ExecuteQueryOptions,
  ): Promise<void> {
    await connection.executeQuery(
      compileQuery(
        parseSavepointCommand('release', savepointName),
        createQueryId(),
      ),
      options,
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
  Client?: PostgresClientConstructor
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
    if (!this.#queryId) {
      return
    }

    const { Client, poolOptions } = this.#options

    const queryIdToCancel = this.#queryId
    const cancelQuery = `select pg_cancel_backend(${this.#pid})`

    // we fallback to a pool connection, and execute a SQL query to cancel the
    // query. this is not ideal, as we might have to wait for an idle connection.
    if (!Client) {
      return await controlConnectionProvider(async (controlConnection) => {
        // by the time we get the connection, another query might have been executed.
        // we need to ensure we're not canceling the wrong query.
        if (queryIdToCancel === this.#queryId) {
          await controlConnection.executeQuery(
            CompiledQuery.raw(cancelQuery, []),
          )
        }
      })
    }

    const controlClient = new Client({ ...poolOptions })

    try {
      await controlClient.connect()

      // by the time we get the connection, another query might have been executed.
      // we need to ensure we're not canceling the wrong query.
      if (queryIdToCancel !== this.#queryId) {
        return
      }

      await controlClient.query(cancelQuery, [])
    } finally {
      controlClient.end()
    }
  }

  async executeQuery<O>(
    compiledQuery: CompiledQuery,
    options?: ExecuteQueryOptions,
  ): Promise<QueryResult<O>> {
    try {
      if (options?.signal) {
        await this.#setupCancelability()
      }

      this.#queryId = compiledQuery.queryId

      const result = await this.#client.query<O>(compiledQuery.sql, [
        ...compiledQuery.parameters,
      ])

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
      this.#queryId = undefined
    }
  }

  async *streamQuery<O>(
    compiledQuery: CompiledQuery,
    chunkSize: number,
    options?: ExecuteQueryOptions,
  ): AsyncIterableIterator<QueryResult<O>> {
    if (!this.#options.cursor) {
      throw new Error(
        "'cursor' is not present in your postgres dialect config. It's required to make streaming work in postgres.",
      )
    }

    if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
      throw new Error('chunkSize must be a positive integer')
    }

    if (options?.signal) {
      await this.#setupCancelability()
    }

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
      this.#queryId = undefined
      await cursor.close()
    }
  }

  [PRIVATE_RELEASE_METHOD](): void {
    this.#client.release()
  }

  async #setupCancelability(): Promise<void> {
    if (this.#pid) {
      return
    }

    const { processID } = this.#client

    // `processID` is an undocumented member of the `Client` class.
    // it might not exist in old or future versions of the `pg` driver.
    // if it does, use it.
    if (processID) {
      this.#pid = processID
      return
    }

    const {
      rows: [{ pid }],
    } = await this.#client.query<{ pid: string }>(
      'select pg_backend_pid() as pid',
      [],
    )

    this.#pid = Number(pid)
  }
}
