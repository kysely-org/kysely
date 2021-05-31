import { Connection } from './connection'

export interface DriverConfig {
  /**
   * Database server host.
   */
  host: string

  /**
   * The database name.
   */
  database: string

  /**
   * Database server port. Optional, defaults to the engine's default port.
   */
  port?: number

  /**
   * Database user. Optional, defaults to the engine's default user.
   */
  user?: string

  /**
   * Database user password. Optional, defaults to no password.
   */
  password?: string

  /**
   * Connection pooling config.
   */
  pool?: PoolConfig
}

export interface PoolConfig {
  /**
   * Maximum number of connections the pool should contain
   * by default this is set to 10.
   */
  maxConnections?: number

  /**
   * Number of milliseconds to wait before timing out when connecting a new
   * connection. By default this is 0 which means no timeout.
   */
  connectionTimeoutMillis?: number

  /**
   * Number of milliseconds a connection must sit idle in the pool and not
   * be checked out before it is disconnected from the backend and discarded.
   * Default is 10000 (10 seconds). Set to 0 to disable auto-disconnection of
   * idle clients
   */
  idleTimeoutMillis?: number

  /**
   * This is executed for each database connection when it is created.
   *
   * @example
   * ```ts
   * {
   *   async onCreateConnection(connection: Connection): Promise<void> {
   *     await connection.execute({
   *       sql: `SET TIMEZONE = 'UTC'`,
   *       bindings: []
   *     })
   *   }
   * }
   * ```
   */
  onCreateConnection?: (connection: Connection) => Promise<void>
}

/**
 * Driver config with default values set.
 */
export interface DriverConfigWithDefaults extends DriverConfig {
  port: number
  pool: PoolConfigWithDefaults
}

/**
 * Pool config with default values set.
 */
export interface PoolConfigWithDefaults extends PoolConfig {
  maxConnections: number
  connectionTimeoutMillis: number
  idleTimeoutMillis: number
}
