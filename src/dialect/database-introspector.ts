import type { Expression } from '../expression/expression.js'
import type { SqlBool } from '../util/type-utils.js'

/**
 * An interface for getting the database metadata (names of the tables and columns etc.)
 */
export interface DatabaseIntrospector {
  /**
   * Get schema metadata.
   */
  getSchemas(options?: DatabaseSchemaMetadataOptions): Promise<SchemaMetadata[]>

  /**
   * Get tables and views metadata.
   */
  getTables(options?: DatabaseMetadataOptions): Promise<TableMetadata[]>
}

export interface DatabaseSchemaMetadataOptions {
  /**
   * An optional SQL `where` expression for filtering the schemas returned by
   * the introspector.
   *
   * The refs argument contains an SQL reference to the schema name column
   * within the catalog query this expression will be used in.
   */
  where?: (
    refs: Readonly<{
      schema: Expression<string>
    }>,
  ) => Expression<SqlBool>
}

export interface DatabaseMetadataOptions {
  /**
   * If this is true, only tables from the default database are returned.
   *
   * This option only affects MySQL and defaults to true. System databases are
   * excluded regardless of this option.
   */
  defaultDatabaseOnly?: boolean

  /**
   * An optional SQL `where` expression for filtering the tables returned by
   * the introspector.
   *
   * The refs argument contains SQL references to the table name and optional
   * schema name columns within the catalog query this expression will be used
   * in.
   */
  where?: (
    refs: Readonly<{
      table: Expression<string>
      schema?: Expression<string>
    }>,
  ) => Expression<SqlBool>

  /**
   * If this is true, the metadata contains the internal kysely tables
   * such as the migration tables.
   */
  withInternalKyselyTables: boolean
}

export interface SchemaMetadata {
  readonly name: string
}

export interface TableMetadata {
  readonly name: string
  readonly isView: boolean
  readonly isForeign: boolean
  readonly columns: ColumnMetadata[]
  readonly schema?: string
}

export interface ColumnMetadata {
  readonly name: string

  /**
   * The data type of the column as reported by the database.
   *
   * NOTE: This value is whatever the database engine returns and it will be
   *       different on different dialects even if you run the same migrations.
   *       For example `integer` datatype in a migration will produce `int4`
   *       on PostgreSQL, `INTEGER` on SQLite and `int` on MySQL.
   */
  readonly dataType: string

  /**
   * The schema this column's data type was created in.
   */
  readonly dataTypeSchema?: string

  readonly isAutoIncrementing: boolean
  readonly isNullable: boolean
  readonly hasDefaultValue: boolean
  readonly comment?: string
}
