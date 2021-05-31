import { Pool, PoolClient } from 'pg'
import { Connection, QueryResult } from '../../driver/connection'
import { Driver } from '../../driver/driver'
import { CompiledQuery } from '../../query-compiler/compiled-query'
import { freeze } from '../../utils/object-utils'

export class PostgresDriver extends Driver {
  #pgPool: Pool | null = null
  #pgClients = new WeakSet<PoolClient>()

  async init(): Promise<void> {
    // Import the `pg` module here instead at the top of the file
    // so that this file can be loaded by node without `pg` driver
    // installed. As you can see, there IS an import from `pg` at the
    // top level too, but that's only for types. It doesn't get compiled
    // into javascript. You can check the built javascript code.
    const pg = await importPg()

    const cfg = this.config
    // Use the `pg` module's own pool. All drivers should use the
    // pool provided by the database connector library if possible.
    this.#pgPool = new pg.Pool({
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

  getDefaultPort(): number {
    return 5432
  }

  async destroy(): Promise<void> {
    if (this.#pgPool) {
      const pool = this.#pgPool
      this.#pgPool = null
      await pool.end()
    }
  }

  async acquireConnection(): Promise<Connection> {
    const pgClient = await this.#pgPool!.connect()
    const connection = new PostgresConnection(pgClient)

    if (!this.#pgClients.has(pgClient)) {
      this.#pgClients.add(pgClient)

      if (this.config.pool.onCreateConnection) {
        await this.config.pool.onCreateConnection(connection)
      }
    }

    return connection
  }

  async releaseConnection(connection: Connection): Promise<void> {
    await (connection as PostgresConnection).release()
  }
}

async function importPg() {
  try {
    return import('pg')
  } catch (error) {
    throw new Error(
      'Postgres client not installed. Please run `npm install pg`'
    )
  }
}

class PostgresConnection implements Connection {
  #pgClient: PoolClient

  constructor(pgClient: PoolClient) {
    this.#pgClient = pgClient
  }

  async execute<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const result = await this.#pgClient.query<O>(compiledQuery.sql, [
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

  async release(): Promise<void> {
    await this.#pgClient.release()
  }
}
