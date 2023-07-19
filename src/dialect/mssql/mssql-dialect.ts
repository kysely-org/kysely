import { Driver } from '../../driver/driver.js'
import { Kysely } from '../../kysely.js'
import { QueryCompiler } from '../../query-compiler/query-compiler.js'
import { DatabaseIntrospector } from '../database-introspector.js'
import { DialectAdapter } from '../dialect-adapter.js'
import { Dialect } from '../dialect.js'
import { MssqlAdapter } from './mssql-adapter.js'
import { MssqlDialectConfig } from './mssql-dialect-config.js'
import { MssqlDriver } from './mssql-driver.js'
import { MssqlIntrospector } from './mssql-introspector.js'
import { MssqlQueryCompiler } from './mssql-query-compiler.js'

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
