import { Driver } from '../../driver/driver.js'
import { Kysely } from '../../kysely.js'
import { QueryCompiler } from '../../query-compiler/query-compiler.js'
import { Dialect } from '../dialect.js'
import { DatabaseIntrospector } from '../database-introspector.js'
import { SqliteDriver } from './sqlite-driver.js'
import { SqliteQueryCompiler } from './sqlite-query-compiler.js'
import { SqliteIntrospector } from './sqlite-introspector.js'
import { DialectAdapter } from '../dialect-adapter.js'
import { SqliteAdapter } from './sqlite-adapter.js'
import { SqliteDialectConfig } from './sqlite-dialect-config.js'

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
