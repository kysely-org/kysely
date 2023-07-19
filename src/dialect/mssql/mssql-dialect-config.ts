import { ConnectionPool } from 'mssql'
import { DatabaseConnection } from '../../driver/database-connection.js'

export interface MssqlDialectConfig {
  /**
   * A mssql Pool instance or a function that returns one.
   *
   * If a function is provided, it's called once when the first query is executed.
   *
   * https://github.com/sidorares/node-mysql2#using-connection-pools
   */
  pool: ConnectionPool | (() => Promise<ConnectionPool>)

  /**
   * Called once for each created connection.
   */
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>
}

export interface MssqlPool {
  // TODO: ...
}

export interface MssqlPoolConnection {
  // TODO: ...
}
