import { Pool, PoolClient } from 'pg'
import { Connection } from '../../driver/connection'
import { Driver } from '../../driver/driver'
import { CompiledQuery } from '../../query-compiler/compiled-query'

export class PostgresDriver extends Driver {
  #pgPool: Pool | null = null
  #pgClients = new WeakMap<Connection, PoolClient>()

  async init(): Promise<void> {
    // Import the `pg` module here instead at the top of the file
    // so that this file can be loaded by node without `pg` driver
    // installed. As you can see, there IS an import from `pg` at the
    // top level too, but that's only for types. It doesn't get compiled
    // into javascript. You can check the built javascript code.
    const pg = await importPg()

    const cfg = this.config
    // Use the pg modules own pool. All drivers should use the
    // pool provided by the database connector library if possible.
    this.#pgPool = new pg.Pool({
      host: cfg.host,
      database: cfg.database,

      port: cfg.port ?? 5432,
      user: cfg.user,
      password: cfg.password,

      // Pool options.
      connectionTimeoutMillis: cfg.pool?.connectionTimeoutMillis ?? 0,
      idleTimeoutMillis: cfg.pool?.idleTimeoutMillis ?? 10000,
      max: cfg.pool?.maxConnections ?? 10,
    })
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

    // Save the client to a local weak map so that we can keep the
    // client completely hidden inside the PostgresConnection without
    // any way to get it out of it.
    this.#pgClients.set(connection, pgClient)

    return connection
  }

  async releaseConnection(connection: Connection): Promise<void> {
    this.#pgClients.get(connection)?.release()
    this.#pgClients.delete(connection)
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

  async execute<R>(compiledQuery: CompiledQuery): Promise<R[]> {
    console.log(compiledQuery)

    const result = await this.#pgClient.query<R>(compiledQuery.sql, [
      ...compiledQuery.bindings,
    ])

    return result.rows
  }
}
