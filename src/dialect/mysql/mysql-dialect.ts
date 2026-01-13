import type { Driver } from '../../driver/driver.js'
import type { Kysely } from '../../kysely.js'
import type { QueryCompiler } from '../../query-compiler/query-compiler.js'
import type { Dialect } from '../dialect.js'
import type { DatabaseIntrospector } from '../database-introspector.js'
import { MysqlDriver } from './mysql-driver.js'
import { MysqlQueryCompiler } from './mysql-query-compiler.js'
import { MysqlIntrospector } from './mysql-introspector.js'
import type { DialectAdapter } from '../dialect-adapter.js'
import { MysqlAdapter } from './mysql-adapter.js'
import type { MysqlDialectConfig } from './mysql-dialect-config.js'

/**
 * MySQL dialect that uses the [mysql2](https://github.com/sidorares/node-mysql2#readme) library.
 *
 * The constructor takes an instance of {@link MysqlDialectConfig}.
 *
 * ```ts
 * import { createPool } from 'mysql2'
 *
 * new MysqlDialect({
 *   pool: createPool({
 *     database: 'some_db',
 *     host: 'localhost',
 *   })
 * })
 * ```
 *
 * If you want the pool to only be created once it's first used, `pool`
 * can be a function:
 *
 * ```ts
 * import { createPool } from 'mysql2'
 *
 * new MysqlDialect({
 *   pool: async () => createPool({
 *     database: 'some_db',
 *     host: 'localhost',
 *   })
 * })
 * ```
 */
export class MysqlDialect implements Dialect {
  readonly #config: MysqlDialectConfig

  constructor(config: MysqlDialectConfig) {
    this.#config = config
  }

  createDriver(): Driver {
    return new MysqlDriver(this.#config)
  }

  createQueryCompiler(): QueryCompiler {
    return new MysqlQueryCompiler()
  }

  createAdapter(): DialectAdapter {
    return new MysqlAdapter()
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new MysqlIntrospector(db)
  }
}
