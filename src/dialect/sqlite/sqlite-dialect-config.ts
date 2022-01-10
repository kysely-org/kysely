import { DatabaseConnection } from '../../driver/database-connection.js'

/**
 * Config for the SQLite dialect.
 *
 * This interface is equal to `better-sqlite3` library's `Databse` class's constructor parameters.
 *
 * https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#new-databasepath-options
 */
export interface SqliteDialectConfig {
  /**
   * The database file path.
   *
   * This is passed as the first argument for the [Database](https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#new-databasepath-options)
   * class constructor.
   */
  databasePath: string

  /**
   * Open the database connection in readonly mode (default: false)
   */
  readonly?: boolean

  /**
   * If the database does not exist, an Error will be thrown instead of creating a new file.
   * This option is ignored for in-memory, temporary, or readonly database connections
   * (default: false)
   */
  fileMustExist?: boolean

  /**
   * The number of milliseconds to wait when executing queries on a locked database,
   * before throwing a SQLITE_BUSY error (default: 5000)
   */
  timeout?: number

  /**
   * Provide a function that gets called with every SQL string executed by the database connection
   * (default: null)
   */
  verbose?: (sql: string) => void

  /**
   * Called once when the first query is executed.
   *
   * This is a Kysely specific feature and does not come from the `better-sqlite3` module.
   */
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>
}
