import * as stream from 'stream'
import { ConnectionOptions } from 'tls'

import { Driver } from '../../driver/driver.js'
import { Kysely } from '../../kysely.js'
import { QueryCompiler } from '../../query-compiler/query-compiler.js'
import { Dialect } from '../dialect.js'
import { PostgresDriver } from './postgres-driver.js'
import { DatabaseIntrospector } from '../../introspection/database-introspector.js'
import { PostgresIntrospector } from './postgres-introspector.js'
import { PostgresQueryCompiler } from './postgres-query-compiler.js'
import { DialectAdapter } from '../dialect-adapter.js'
import { PostgresAdapter } from './postgres-adapter.js'
import { DatabaseConnection } from '../../driver/database-connection.js'

/**
 * PostgreSQL dialect that uses the [pg](https://node-postgres.com/) library.
 *
 * The {@link PostgresDialectConfig | configuration} passed to the constructor
 * is given as-is to the pg library's [Pool](https://node-postgres.com/api/pool)
 * constructor. See the following two links for more documentation:
 *
 * https://node-postgres.com/api/pool
 * https://node-postgres.com/api/client
 */
export class PostgresDialect implements Dialect {
  readonly #config: PostgresDialectConfig

  constructor(config: PostgresDialectConfig) {
    this.#config = config
  }

  createDriver(): Driver {
    return new PostgresDriver(this.#config)
  }

  createQueryCompiler(): QueryCompiler {
    return new PostgresQueryCompiler()
  }

  createAdapter(): DialectAdapter {
    return new PostgresAdapter()
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new PostgresIntrospector(db)
  }
}

/**
 * Config for the PostgreSQL dialect.
 *
 * This interface is equal to `pg` library's `Pool` config:
 *
 * https://node-postgres.com/api/pool
 * https://node-postgres.com/api/client
 */
export interface PostgresDialectConfig {
  /**
   * defaults process.env.PGUSER || process.env.USER.
   */
  user?: string

  /**
   * default process.env.PGDATABASE || process.env.USER
   */
  database?: string

  /**
   * default process.env.PGPASSWORD
   */
  password?: string | (() => string | Promise<string>)

  /**
   * default process.env.PGPORT
   */
  port?: number

  /**
   * default process.env.PGHOST
   */
  host?: string

  /**
   * e.g. postgres:*user:password@host:5432/database
   */
  connectionString?: string

  /**
   * passed directly to node.TLSSocket, supports all tls.connect options
   */
  ssl?: boolean | ConnectionOptions

  /**
   * Number of milliseconds to wait before timing out when connecting a new client
   * by default this is 0 which means no timeout.
   */
  connectionTimeoutMillis?: number

  /**
   * Maximum number of clients the pool should contain. by default this is set to 10.
   */
  max?: number

  /**
   * Minimum number of clients the pool should contain
   */
  min?: number

  /**
   * Number of milliseconds a client must sit idle in the pool and not be checked out
   * before it is disconnected from the backend and discarded.
   *
   * default is 10000 (10 seconds) - set to 0 to disable auto-disconnection of idle clients.
   */
  idleTimeoutMillis?: number

  /**
   * Default behavior is the pool will keep clients open & connected to the backend
   * until idleTimeoutMillis expire for each client and node will maintain a ref
   * to the socket on the client, keeping the event loop alive until all clients are closed
   * after being idle or the pool is manually shutdown with `pool.end()`.
   *
   * Setting `allowExitOnIdle: true` in the config will allow the node event loop to exit
   * as soon as all clients in the pool are idle, even if their socket is still open
   * to the PostgreSQL server.  This can be handy in scripts & tests
   * where you don't want to wait for your clients to go idle before your process exits.
   */
  allowExitOnIdle?: boolean

  log?: (...messages: any[]) => void

  /**
   * Number of milliseconds before a statement in query will time out, default is no timeout.
   */
  statement_timeout?: false | number

  /**
   * Number of milliseconds before terminating any session with an open idle transaction.
   * Default is no timeout.
   */
  idle_in_transaction_session_timeout?: number

  /**
   * Number of milliseconds before a query call will timeout, default is no timeout.
   */
  query_timeout?: number

  /**
   * The name of the application that created this Client instance.
   */
  application_name?: string

  /**
   * Called once for each created connection.
   *
   * This is a Kysely specific feature and does not come from the `pg` module.
   */
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>

  keepAlive?: boolean
  keepAliveInitialDelayMillis?: number
  types?: any
  stream?: stream.Duplex
  parseInputDatesAsUTC?: boolean
}
