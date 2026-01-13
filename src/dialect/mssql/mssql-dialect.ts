import type { Driver } from '../../driver/driver.js'
import type { Kysely } from '../../kysely.js'
import type { QueryCompiler } from '../../query-compiler/query-compiler.js'
import type { DatabaseIntrospector } from '../database-introspector.js'
import type { DialectAdapter } from '../dialect-adapter.js'
import type { Dialect } from '../dialect.js'
import { MssqlAdapter } from './mssql-adapter.js'
import type { MssqlDialectConfig } from './mssql-dialect-config.js'
import { MssqlDriver } from './mssql-driver.js'
import { MssqlIntrospector } from './mssql-introspector.js'
import { MssqlQueryCompiler } from './mssql-query-compiler.js'

/**
 * MS SQL Server dialect that uses the [tedious](https://tediousjs.github.io/tedious)
 * library.
 *
 * The constructor takes an instance of {@link MssqlDialectConfig}.
 *
 * ```ts
 * import * as Tedious from 'tedious'
 * import * as Tarn from 'tarn'
 *
 * const dialect = new MssqlDialect({
 *   tarn: {
 *     ...Tarn,
 *     options: {
 *       min: 0,
 *       max: 10,
 *     },
 *   },
 *   tedious: {
 *     ...Tedious,
 *     connectionFactory: () => new Tedious.Connection({
 *       authentication: {
 *         options: {
 *           password: 'password',
 *           userName: 'username',
 *         },
 *         type: 'default',
 *       },
 *       options: {
 *         database: 'some_db',
 *         port: 1433,
 *         trustServerCertificate: true,
 *       },
 *       server: 'localhost',
 *     }),
 *   },
 * })
 * ```
 */
export class MssqlDialect implements Dialect {
  readonly #config: MssqlDialectConfig

  constructor(config: MssqlDialectConfig) {
    this.#config = config
  }

  createDriver(): Driver {
    return new MssqlDriver(this.#config)
  }

  createQueryCompiler(): QueryCompiler {
    return new MssqlQueryCompiler()
  }

  createAdapter(): DialectAdapter {
    return new MssqlAdapter()
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new MssqlIntrospector(db)
  }
}
