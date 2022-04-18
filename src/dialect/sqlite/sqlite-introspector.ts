import {
  DatabaseIntrospector,
  DatabaseMetadata,
  DatabaseMetadataOptions,
  SchemaMetadata,
  TableMetadata,
} from '../database-introspector.js'
import { Kysely } from '../../kysely.js'
import {
  DEFAULT_MIGRATION_LOCK_TABLE,
  DEFAULT_MIGRATION_TABLE,
} from '../../migration/migrator.js'
import { ColumnDataType } from '../../operation-node/data-type-node.js'
import { sql } from '../../raw-builder/sql.js'

export class SqliteIntrospector implements DatabaseIntrospector {
  readonly #db: Kysely<any>

  constructor(db: Kysely<any>) {
    this.#db = db
  }

  async getSchemas(): Promise<SchemaMetadata[]> {
    // Sqlite doesn't support schemas.
    return []
  }

  async getTables(
    options: DatabaseMetadataOptions = { withInternalKyselyTables: false }
  ): Promise<TableMetadata[]> {
    let query = this.#db
      .selectFrom('sqlite_schema')
      .where('type', '=', 'table')
      .where('name', 'not like', 'sqlite_%')
      .select('name')
      .castTo<{ name: string }>()

    if (!options.withInternalKyselyTables) {
      query = query
        .where('name', '!=', DEFAULT_MIGRATION_TABLE)
        .where('name', '!=', DEFAULT_MIGRATION_LOCK_TABLE)
    }

    const tables = await query.execute()
    return Promise.all(tables.map(({ name }) => this.#getTableMetadata(name)))
  }

  async getMetadata(
    options?: DatabaseMetadataOptions
  ): Promise<DatabaseMetadata> {
    return {
      tables: await this.getTables(options),
    }
  }

  async #getTableMetadata(table: string): Promise<TableMetadata> {
    const db = this.#db

    const columns = await db
      .selectFrom(sql`PRAGMA_TABLE_INFO(${table})`.as('table_info'))
      .select(['name', 'type', 'notnull'])
      .castTo<{ name: string; type: ColumnDataType; notnull: 0 | 1 }>()
      .execute()

    return {
      name: table,
      columns: columns.map((col) => ({
        name: col.name,
        dataType: col.type,
        isNullable: !col.notnull,
      })),
    }
  }
}
