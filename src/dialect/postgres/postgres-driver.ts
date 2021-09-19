import { Pool, PoolClient, PoolConfig } from 'pg'
import {
  DatabaseConnection,
  QueryResult,
} from '../../driver/database-connection.js'
import { Driver } from '../../driver/driver.js'
import { CompiledQuery } from '../../query-compiler/compiled-query.js'
import { freeze } from '../../util/object-utils.js'

const PRIVATE_RELEASE_METHOD = Symbol()

export class PostgresDriver extends Driver {
  #pool: Pool | null = null
  readonly #connections = new WeakMap<PoolClient, DatabaseConnection>()

  protected override getDefaultPort(): number {
    return 5432
  }

  protected override async init(): Promise<void> {
    const cfg = this.config

    // Import the `pg` module here instead at the top of the file
    // so that this file can be loaded by node without `pg` driver
    // installed. As you can see, there IS an import from `pg` at the
    // top level too, but that's only for types. It doesn't get compiled
    // into javascript. You can check the built javascript code.
    const PoolConstrucor = await importPgPool()

    // Use the `pg` module's own pool. All drivers should use the
    // pool provided by the database library if possible.
    this.#pool = new PoolConstrucor({
      host: cfg.host,
      database: cfg.database,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,

      // Pool options.
      connectionTimeoutMillis: cfg.pool.connectionTimeoutMillis,
      idleTimeoutMillis: cfg.pool.idleTimeoutMillis,
      max: cfg.pool.maxConnections,
    })
  }

  protected override async acquireConnection(): Promise<DatabaseConnection> {
    const client = await this.#pool!.connect()
    let connection = this.#connections.get(client)

    if (!connection) {
      connection = new PostgresConnection(client)
      this.#connections.set(client, connection)

      // The driver must take care of calling `onCreateConnection` when a new
      // connection is created. The `pg` module doesn't provide an async hook
      // for the connection creation. We need to call the method explicitly.
      if (this.config.pool.onCreateConnection) {
        await this.config.pool.onCreateConnection(connection)
      }
    }

    return connection
  }

  protected override async releaseConnection(
    connection: DatabaseConnection
  ): Promise<void> {
    const pgConnection = connection as PostgresConnection
    pgConnection[PRIVATE_RELEASE_METHOD]()
  }

  protected override async destroy(): Promise<void> {
    if (this.#pool) {
      const pool = this.#pool
      this.#pool = null
      await pool.end()
    }
  }
}

async function importPgPool(): Promise<new (config: PoolConfig) => Pool> {
  try {
    // There's something funky in the typings here.
    const pg = (await import('pg')) as any
    return pg.default.Pool
  } catch (error) {
    throw new Error(
      'Postgres client not installed. Please run `npm install pg`'
    )
  }
}

class PostgresConnection implements DatabaseConnection {
  #client: PoolClient

  constructor(client: PoolClient) {
    this.#client = client
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const result = await this.#client.query<O>(compiledQuery.sql, [
      ...compiledQuery.bindings,
    ])

    return freeze({
      numUpdatedOrDeletedRows:
        result.command === 'UPDATE' || result.command === 'DELETE'
          ? result.rowCount
          : undefined,
      insertedPrimaryKey: undefined,
      rows: result.rows,
    })
  }

  [PRIVATE_RELEASE_METHOD](): void {
    this.#client.release()
  }
}
