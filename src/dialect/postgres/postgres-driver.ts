import {
  ControlConnectionProvider,
  DatabaseConnection,
  QueryOptions,
  QueryResult,
} from '../../driver/database-connection.js'
import { Driver, TransactionSettings } from '../../driver/driver.js'
import { parseSavepointCommand } from '../../parser/savepoint-parser.js'
import { CompiledQuery } from '../../query-compiler/compiled-query.js'
import { QueryCompiler } from '../../query-compiler/query-compiler.js'
import { logOnce } from '../../util/log-once.js'
import { isFunction, freeze } from '../../util/object-utils.js'
import { createQueryId } from '../../util/query-id.js'
import { extendStackTrace } from '../../util/stack-trace-utils.js'
import {
  PostgresCursorConstructor,
  PostgresDialectConfig,
  PostgresPool,
  PostgresPoolClient,
} from './postgres-dialect-config.js'

const PRIVATE_RELEASE_METHOD = Symbol()

export class PostgresDriver implements Driver {
  readonly #config: PostgresDialectConfig
  readonly #connections = new WeakMap<PostgresPoolClient, DatabaseConnection>()
  #pool?: PostgresPool

  constructor(config: PostgresDialectConfig) {
    this.#config = freeze({ ...config })
  }

  async init(): Promise<void> {
    this.#pool = isFunction(this.#config.pool)
      ? await this.#config.pool()
      : this.#config.pool
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    const client = await this.#pool!.connect()
    let connection = this.#connections.get(client)

    if (!connection) {
      connection = new PostgresConnection(client, {
        cursor: this.#config.cursor ?? null,
      })
      this.#connections.set(client, connection)

      // The driver must take care of calling `onCreateConnection` when a new
      // connection is created. The `pg` module doesn't provide an async hook
      // for the connection creation. We need to call the method explicitly.
      if (this.#config.onCreateConnection) {
        await this.#config.onCreateConnection(connection)
      }
    }

    if (this.#config.onReserveConnection) {
      await this.#config.onReserveConnection(connection)
    }

    return connection
  }

  async beginTransaction(
    connection: DatabaseConnection,
    settings: TransactionSettings,
  ): Promise<void> {
    if (settings.isolationLevel || settings.accessMode) {
      let sql = 'start transaction'

      if (settings.isolationLevel) {
        sql += ` isolation level ${settings.isolationLevel}`
      }

      if (settings.accessMode) {
        sql += ` ${settings.accessMode}`
      }

      await connection.executeQuery(CompiledQuery.raw(sql))
    } else {
      await connection.executeQuery(CompiledQuery.raw('begin'))
    }
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
  cursor: PostgresCursorConstructor | null
}

class PostgresConnection implements DatabaseConnection {
  readonly #client: PostgresPoolClient
  readonly #options: PostgresConnectionOptions
  #pid: unknown

  constructor(client: PostgresPoolClient, options: PostgresConnectionOptions) {
    this.#client = client
    this.#options = options
  }

  async cancelQuery(
    controlConnectionProvider: ControlConnectionProvider,
  ): Promise<void> {
    if (!this.#pid) {
      return logOnce(
        'kysely:warning: cannot cancel query because the connection has not been made cancelable.',
      )
    }

    return await controlConnectionProvider(async (controlConnection) => {
      await controlConnection.executeQuery(
        CompiledQuery.raw('select pg_cancel_backend($1)', [this.#pid]),
      )
    })
  }

  async executeQuery<O>(
    compiledQuery: CompiledQuery,
    options?: QueryOptions,
  ): Promise<QueryResult<O>> {
    try {
      if (options?.cancelable) {
        await this.#setupCancelability()
      }

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
    }
  }

  async *streamQuery<O>(
    compiledQuery: CompiledQuery,
    chunkSize: number,
    options?: QueryOptions,
  ): AsyncIterableIterator<QueryResult<O>> {
    if (!this.#options.cursor) {
      throw new Error(
        "'cursor' is not present in your postgres dialect config. It's required to make streaming work in postgres.",
      )
    }

    if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
      throw new Error('chunkSize must be a positive integer')
    }

    if (options?.cancelable) {
      await this.#setupCancelability()
    }

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
    }
  }

  [PRIVATE_RELEASE_METHOD](): void {
    this.#client.release()
  }

  async #setupCancelability(): Promise<void> {
    if (this.#pid) {
      return
    }

    const {
      rows: [row],
    } = await this.#client.query<{ pid: unknown }>(
      'select pg_backend_pid() as pid',
      [],
    )

    this.#pid = row.pid
  }
}
