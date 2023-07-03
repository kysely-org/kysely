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
      .selectFrom('sqlite_master')
      .where('type', 'in', ['table', 'view'])
      .where('name', 'not like', 'sqlite_%')
      .select('name')
      .orderBy('name')
      .$castTo<{ name: string }>()

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

    // Get the SQL that was used to create the table.
    const tableDefinition = await db
      .selectFrom('sqlite_master')
      .where('name', '=', table)
      .select(['sql', 'type'])
      .$castTo<{ sql: string | undefined; type: string }>()
      .executeTakeFirstOrThrow()

    // Try to find the name of the column that has `autoincrement` 🤦
    const autoIncrementCol = tableDefinition.sql
      ?.split(/[\(\),]/)
      ?.find((it) => it.toLowerCase().includes('autoincrement'))
      ?.trimStart()
      ?.split(/\s+/)?.[0]
      ?.replace(/["`]/g, '')

    const columns = await db
      .selectFrom(
        sql<{
          name: string
          type: string
          notnull: 0 | 1
          dflt_value: any
        }>`pragma_table_info(${table})`.as('table_info')
      )
      .select(['name', 'type', 'notnull', 'dflt_value'])
      .orderBy('cid')
      .execute()

    return {
      name: table,
      isView: tableDefinition.type === 'view',
      columns: columns.map((col) => ({
        name: col.name,
        dataType: col.type,
        isNullable: !col.notnull,
        isAutoIncrementing: col.name === autoIncrementCol,
        hasDefaultValue: col.dflt_value != null,
      })),
    }
  }
}
