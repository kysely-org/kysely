import { Driver } from '../driver/driver'
import { DriverConfig } from '../driver/driver-config'
import { Kysely } from '../kysely'
import { QueryCompiler } from '../query-compiler/query-compiler'

/**
 * A Dialect is an adapter between Kysely and the underlying database driver.
 *
 * See the built-in {@link PostgresDialect} as an example of a dialect.
 * Users can implement their own dialects and use them by passing it
 * in the {@link KyselyConfig.dialect} property.
 */
export interface Dialect {
  /**
   * Creates a driver for the dialect¨.
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
