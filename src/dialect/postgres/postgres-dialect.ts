import { Driver } from '../../driver/driver'
import { DriverConfig } from '../../driver/driver-config'
import { DefaultQueryCompiler } from '../../query-compiler/default-query-compiler'
import { QueryCompiler } from '../../query-compiler/query-compiler'
import { Dialect } from '../dialect'
import { PostgresDriver } from './postgres-driver'

export class PostgresDialect implements Dialect {
  createDriver(config: DriverConfig): Driver {
    return new PostgresDriver(config)
  }

  createQueryCompiler(): QueryCompiler {
    // The default query compiler is for postgres dialect.
    return new DefaultQueryCompiler()
  }
}
