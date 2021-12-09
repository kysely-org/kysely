import { Driver } from '../../driver/driver.js'
import { Kysely } from '../../kysely.js'
import { QueryCompiler } from '../../query-compiler/query-compiler.js'
import { Dialect } from '../dialect.js'
import { DatabaseIntrospector } from '../../introspection/database-introspector.js'
import { SqliteDriver } from './sqlite-driver.js'
import { SqliteQueryCompiler } from './sqlite-query-compiler.js'
import { SqliteIntrospector } from './sqlite-introspector.js'
import { DialectAdapter } from '../dialect-adapter.js'
import { DatabaseConnection } from '../../driver/database-connection.js'
import { SqliteAdapter } from './sqlite-adapter.js'

/**
 * SQLite dialect that uses the [better-sqlite3](https://github.com/JoshuaWise/better-sqlite3) library.
 *
 * The {@link SqliteDialectConfig | configuration} is used to construct an instance of
 * [Database](https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#new-databasepath-options)
 * class. The configuration values are passed directly to the `Database` constructor.
 */
export class SqliteDialect implements Dialect {
  readonly #config: SqliteDialectConfig

  constructor(config: SqliteDialectConfig) {
    this.#config = config
  }

  createDriver(): Driver {
    return new SqliteDriver(this.#config)
  }

  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler()
  }

  createAdapter(): DialectAdapter {
    return new SqliteAdapter()
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new SqliteIntrospector(db)
  }
}

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
