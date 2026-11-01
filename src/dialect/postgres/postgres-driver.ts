import type {
  DatabaseConnection,
  QueryResult,
} from '../../driver/database-connection.js'
import type { Driver, TransactionSettings } from '../../driver/driver.js'
import { AbortedTransactionError } from '../../driver/aborted-transaction-error.js'
import { parseSavepointCommand } from '../../parser/savepoint-parser.js'
import { CompiledQuery } from '../../query-compiler/compiled-query.js'
import type { QueryCompiler } from '../../query-compiler/query-compiler.js'
import { isFunction, freeze } from '../../util/object-utils.js'
import { createQueryId } from '../../util/query-id.js'
import { extendStackTrace } from '../../util/stack-trace-utils.js'
import type {
  PostgresCursorConstructor,
  PostgresDialectConfig,
  PostgresPool,
  PostgresPoolClient,
} from './postgres-dialect-config.js'

const PRIVATE_RELEASE_METHOD: unique symbol = Symbol()
const PRIVATE_MARK_FOR_DISCARD_METHOD: unique symbol = Symbol()

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

    // `destroy` was called while the connection was being acquired.
    if (!this.#pool) {
      client.release()
      throw new Error('driver has already been destroyed')
    }

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
    const { rows } = await connection.executeQuery<{ command: string }>(
      CompiledQuery.raw('commit'),
    )

    // PostgreSQL completes COMMIT with a ROLLBACK tag if an earlier
    // statement error left the transaction aborted.
    if (rows[0]?.command === 'ROLLBACK') {
      throw new AbortedTransactionError()
    }
  }

  async rollbackTransaction(connection: PostgresConnection): Promise<void> {
    try {
      await connection.executeQuery(CompiledQuery.raw('rollback'))
    } catch (err) {
      connection[PRIVATE_MARK_FOR_DISCARD_METHOD]()
      throw err
    }
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
  #client: PostgresPoolClient
  #options: PostgresConnectionOptions
  #discarded?: boolean

  constructor(client: PostgresPoolClient, options: PostgresConnectionOptions) {
    this.#client = client
    this.#options = options
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    this.#assertNotDiscarded()

    try {
      const { command, rowCount, rows } = await this.#client.query<O>(
        compiledQuery.sql,
        [...compiledQuery.parameters],
      )

      if (command === 'ROLLBACK' || command === 'COMMIT') {
        return { rows: [{ command } as O] }
      }

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
  ): AsyncIterableIterator<QueryResult<O>> {
    if (!this.#options.cursor) {
      throw new Error(
        "'cursor' is not present in your postgres dialect config. It's required to make streaming work in postgres.",
      )
    }

    if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
      throw new Error('chunkSize must be a positive integer')
    }

    this.#assertNotDiscarded()

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
    this.#client.release(Boolean(this.#discarded))
  }

  [PRIVATE_MARK_FOR_DISCARD_METHOD](): void {
    this.#discarded = true
  }

  #assertNotDiscarded(): void {
    if (this.#discarded) {
      throw new Error('Postgres connection has been discarded')
    }
  }
}
