import {
  DatabaseConnection,
  QueryResult,
} from '../../driver/database-connection.js'
import { Driver, TransactionSettings } from '../../driver/driver.js'
import { CompiledQuery } from '../../query-compiler/compiled-query.js'
import { isFunction, freeze } from '../../util/object-utils.js'
import { extendStackTrace } from '../../util/stack-trace-utils.js'
import {
  PostgresCursor,
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
      if (this.#config?.onCreateConnection) {
        await this.#config.onCreateConnection(connection)
      }
    }

    return connection
  }

  async beginTransaction(
    connection: DatabaseConnection,
    settings: TransactionSettings
  ): Promise<void> {
    if (settings.isolationLevel) {
      await connection.executeQuery(
        CompiledQuery.raw(
          `start transaction isolation level ${settings.isolationLevel}`
        )
      )
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

  constructor(client: PostgresPoolClient, options: PostgresConnectionOptions) {
    this.#client = client
    this.#options = options
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    try {
      const result = await this.#client.query<O>(compiledQuery.sql, [
        ...compiledQuery.parameters,
      ])

      if (result.command === 'UPDATE' || result.command === 'DELETE') {
        return {
          numUpdatedOrDeletedRows: BigInt(result.rowCount),
          rows: result.rows ?? [],
        }
      }

      return {
        rows: result.rows ?? [],
      }
    } catch (err) {
      throw extendStackTrace(err, new Error())
    }
  }

  async *executeQueryStream<O>(
    compiledQuery: CompiledQuery,
    chunkSize: number
  ): AsyncIterableIterator<QueryResult<O>> {
    if (!this.#options.cursor) {
      throw new Error(
        "'cursor' is not present in your postgres dialect config. It's required to make streaming work in postgres."
      )
    }

    const cursor = this.#client.query(
      new this.#options.cursor<O>(compiledQuery.sql, compiledQuery.parameters)
    )

    while (true) {
      if (cursor.state === 'done') {
        break
      }

      if (cursor.state === 'error') {
        throw cursor._error
      }

      const rows: O[] = await cursor.read(chunkSize)

      yield {
        rows,
      }
    }
  }

  [PRIVATE_RELEASE_METHOD](): void {
    this.#client.release()
  }
}
