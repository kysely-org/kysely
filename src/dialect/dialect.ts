import { Driver } from '../driver/driver.js'
import { DriverConfig } from '../driver/driver-config.js'
import { Kysely } from '../kysely.js'
import { QueryCompiler } from '../query-compiler/query-compiler.js'
import { DatabaseIntrospector } from '../introspection/database-introspector.js'

/**
 * A Dialect is an adapter between Kysely and the underlying database driver.
 *
 * See the built-in {@link PostgresDialect} as an example of a dialect.
 * Users can implement their own dialects and use them by passing it
 * in the {@link KyselyConfig.dialect} property.
 */
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
   * Creates a database introspector that can be used to get the database metadata
   * such as the tables and columns that exist in the database.
   */
  createIntrospector(db: Kysely<any>): DatabaseIntrospector
}
