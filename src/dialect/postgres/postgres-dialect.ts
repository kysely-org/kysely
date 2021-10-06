import { Driver } from '../../driver/driver.js'
import { DriverConfig } from '../../driver/driver-config.js'
import { Kysely } from '../../kysely.js'
import { DefaultQueryCompiler } from '../../query-compiler/default-query-compiler.js'
import { QueryCompiler } from '../../query-compiler/query-compiler.js'
import { Dialect } from '../dialect.js'
import { PostgresDriver } from './postgres-driver.js'
import { DatabaseIntrospector } from '../../introspection/database-introspector.js'
import { PostgresIntrospector } from './postgres-introspector.js'

export class PostgresDialect implements Dialect {
  createDriver(config: DriverConfig): Driver {
    return new PostgresDriver(config)
  }

  createQueryCompiler(): QueryCompiler {
    // The default query compiler is for postgres dialect.
    return new DefaultQueryCompiler()
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new PostgresIntrospector(db)
  }
}
