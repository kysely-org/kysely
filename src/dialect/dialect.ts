import { Driver } from '../driver/driver'
import { DriverConfig } from '../driver/driver-config'
import { Kysely } from '../kysely'
import { QueryCompiler } from '../query-compiler/query-compiler'

export interface Dialect {
  /**
   * Creates a driver for the dialect.
   */
  createDriver(config: DriverConfig): Driver

  /**
   * Creates a query compiler for the dialect.
   */
  createQueryCompiler(): QueryCompiler

  /**
   * Returns metadata for a table or `undefined` if the table doesn't exists.
   */
  getTableMetadata(
    db: Kysely<any>,
    tableName: string
  ): Promise<TableMetadata | undefined>
}

export interface TableMetadata {
  tableName: string
}
