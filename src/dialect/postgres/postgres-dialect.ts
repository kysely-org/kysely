import { Driver } from '../../driver/driver.js'
import { Kysely } from '../../kysely.js'
import { QueryCompiler } from '../../query-compiler/query-compiler.js'
import { Dialect } from '../dialect.js'
import { PostgresDriver, PostgresPool } from './postgres-driver.js'
import { DatabaseIntrospector } from '../database-introspector.js'
import { PostgresIntrospector } from './postgres-introspector.js'
import { PostgresQueryCompiler } from './postgres-query-compiler.js'
import { DialectAdapter } from '../dialect-adapter.js'
import { PostgresAdapter } from './postgres-adapter.js'
import { PostgresDialectConfig } from './postgres-dialect-config.js'

/**
 * PostgreSQL dialect that uses the [pg](https://node-postgres.com/) library.
 *
 * The {@link PostgresDialectConfig | configuration} passed to the constructor
 * is given as-is to the pg library's [Pool](https://node-postgres.com/api/pool)
 * constructor. See the following two links for more documentation:
 *
 * https://node-postgres.com/api/pool
 * https://node-postgres.com/api/client
 *
 * You can also provide an existing pg `Pool` instance:
 *
 * ```ts
 * import { Pool } from 'pg'
 * new PostgresDialect(new Pool(config))
 * ```
 */
export class PostgresDialect implements Dialect {
  readonly #configOrPool: PostgresDialectConfig | PostgresPool

  constructor(configOrPool: PostgresDialectConfig | PostgresPool) {
    this.#configOrPool = configOrPool
  }

  createDriver(): Driver {
    return new PostgresDriver(this.#configOrPool)
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
