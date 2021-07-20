import { Driver } from '../driver/driver'
import { DriverConfig } from '../driver/driver-config'
import { QueryCompiler } from '../query-compiler/query-compiler'

export interface Dialect {
  createDriver(config: DriverConfig): Driver
  createQueryCompiler(): QueryCompiler
  lockMigration(): Promise<void>
  unlockMigration(): Promise<void>
}
