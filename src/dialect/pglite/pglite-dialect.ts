import type { Driver } from '../../driver/driver.js'
import type { Kysely } from '../../kysely.js'
import type { QueryCompiler } from '../../query-compiler/query-compiler.js'
import type { DatabaseIntrospector } from '../database-introspector.js'
import type { DialectAdapter } from '../dialect-adapter.js'
import type { Dialect } from '../dialect.js'
import { PostgresIntrospector } from '../postgres/postgres-introspector.js'
import { PostgresQueryCompiler } from '../postgres/postgres-query-compiler.js'
import { PGliteAdapter } from './pglite-adapter.js'
import type { PGliteDialectConfig } from './pglite-dialect-config.js'
import { PGliteDriver } from './pglite-driver.js'

/**
 * PGlite dialect.
 *
 * The constructor takes an instance of {@link PGliteDialectConfig}.
 *
 * ```ts
 * import { PGlite } from '@electric-sql/pglite'
 *
 * new PGliteDialect({
 *   pglite: new PGlite()
 * })
 * ```
 *
 * If you want the client to only be created once it's first used, `pglite`
 * can be a function:
 *
 * ```ts
 * import { PGlite } from '@electric-sql/pglite'
 *
 * new PGliteDialect({
 *   pglite: () => new PGlite()
 * })
 * ```
 */
export class PGliteDialect implements Dialect {
  readonly #config: PGliteDialectConfig

  constructor(config: PGliteDialectConfig) {
    this.#config = config
  }

  createAdapter(): DialectAdapter {
    return new PGliteAdapter()
  }

  createDriver(): Driver {
    return new PGliteDriver(this.#config)
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new PostgresIntrospector(db)
  }

  createQueryCompiler(): QueryCompiler {
    return new PostgresQueryCompiler()
  }
}
