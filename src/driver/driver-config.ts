import { Connection } from './connection'

export interface DriverConfig {
  host: string
  database: string
  port?: number
  user?: string
  password?: string
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
