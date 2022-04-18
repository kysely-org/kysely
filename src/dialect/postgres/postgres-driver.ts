import {
  DatabaseConnection,
  QueryResult,
} from '../../driver/database-connection.js'
import { Driver, TransactionSettings } from '../../driver/driver.js'
import { CompiledQuery } from '../../query-compiler/compiled-query.js'
import { isFunction, freeze, isObject } from '../../util/object-utils.js'
import { extendStackTrace } from '../../util/stack-trace-utils.js'
import { PostgresDialectConfig } from './postgres-dialect-config.js'

const PRIVATE_RELEASE_METHOD = Symbol()

export class PostgresDriver implements Driver {
  readonly #config?: PostgresDialectConfig
  readonly #connections = new WeakMap<PostgresPoolClient, DatabaseConnection>()
  #pool?: PostgresPool

  constructor(configOrPool: PostgresDialectConfig | PostgresPool) {
    if (isPostgresPool(configOrPool)) {
      this.#pool = configOrPool
    } else {
      this.#config = freeze({ ...configOrPool })
    }
  }

  async init(): Promise<void> {
    if (this.#config) {
      // Import the `pg` module here instead at the top of the file
      // so that this file can be loaded by node without `pg` driver
      // installed.
      const PoolConstructor = await importPgPool()

      // Use the `pg` module's own pool. All drivers should use the
      // pool provided by the database library if possible.
      this.#pool = new PoolConstructor(this.#config)
    }
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    const client = await this.#pool!.connect()
    let connection = this.#connections.get(client)

    if (!connection) {
      connection = new PostgresConnection(client)
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

export interface PostgresPool {
  connect(): Promise<PostgresPoolClient>
  end(): Promise<void>
}

interface PostgresPoolClient {
  query<R>(
    sql: string,
    parameters: ReadonlyArray<unknown>
  ): Promise<PostgresQueryResult<R>>
  release(): void
}

interface PostgresQueryResult<R> {
  command: 'UPDATE' | 'DELETE' | 'INSERT' | 'SELECT'
  rowCount: number
  rows: R[]
}

type PoolConstructor = new (config: PostgresDialectConfig) => PostgresPool

function isPostgresPool(obj: unknown): obj is PostgresPool {
  return isObject(obj) && isFunction(obj.connect) && isFunction(obj.end)
}

async function importPgPool(): Promise<PoolConstructor> {
  try {
    // The imported module name must be a string literal to make
    // some bundlers work. So don't move this code behind a helper
    // for example.
    const pgModule: any = await import('pg')

    if (isFunction(pgModule.Pool)) {
      return pgModule.Pool
    } else {
      return pgModule.default.Pool
    }
  } catch (error) {
    throw new Error(
      'Postgres client not installed. Please run `npm install pg`'
    )
  }
}

class PostgresConnection implements DatabaseConnection {
  #client: PostgresPoolClient

  constructor(client: PostgresPoolClient) {
    this.#client = client
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

  [PRIVATE_RELEASE_METHOD](): void {
    this.#client.release()
  }
}
