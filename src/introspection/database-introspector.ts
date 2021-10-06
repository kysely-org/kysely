import { ColumnDataType } from '../operation-node/data-type-node'

/**
 * An interface for getting the database metadata (names of the tables and columns etc.)
 */
export interface DatabaseIntrospector {
  /**
   * Get the database metadata such as the names of the tables and columns.
   */
  getMetadata(options?: DatabaseMetadataOptions): Promise<DatabaseMetadata>
}

export interface DatabaseMetadataOptions {
  /**
   * If this is true, the metadata contains the internal kysely tables
   * such as the migration tables.
   */
  withInternalKyselyTables: boolean
}

export interface DatabaseMetadata {
  /**
   * The tables found in the database.
   */
  readonly tables: TableMetadata[]
}

export interface TableMetadata {
  readonly name: string
  readonly schema?: string
  readonly columns: ColumnMetadata[]
}

export interface ColumnMetadata {
  readonly name: string
  readonly dataType: ColumnDataType
  readonly isNullable: boolean
}
