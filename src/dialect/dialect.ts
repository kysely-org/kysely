import { Driver } from '../driver/driver.js'
import { Kysely } from '../kysely.js'
import { QueryCompiler } from '../query-compiler/query-compiler.js'
import { DatabaseIntrospector } from '../introspection/database-introspector.js'
import { DialectAdapter } from './dialect-adapter.js'

/**
 * A Dialect is the glue between Kysely and the underlying database engine.
 *
 * See the built-in {@link PostgresDialect} as an example of a dialect.
 * Users can implement their own dialects and use them by passing it
 * in the {@link KyselyConfig.dialect} property.
 */
export interface Dialect {
  /**
   * Creates a driver for the dialect.
   */
  createDriver(): Driver

  /**
   * Creates a query compiler for the dialect.
   */
  createQueryCompiler(): QueryCompiler

  /**
   * Creates an adapter for the dialect.
   */
  createAdapter(): DialectAdapter

  /**
   * Creates a database introspector that can be used to get the database metadata
   * such as the tables and columns that exist in the database.
   *
   * `db` never has any plugins installed. It's created using
   * {@link Kysely.withoutPlugins}.
   */
  createIntrospector(db: Kysely<any>): DatabaseIntrospector
}
