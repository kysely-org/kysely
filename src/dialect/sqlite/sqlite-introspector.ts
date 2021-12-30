import {
  DatabaseIntrospector,
  DatabaseMetadata,
  DatabaseMetadataOptions,
  TableMetadata,
} from '../database-introspector.js'
import { Kysely } from '../../kysely.js'
import {
  MIGRATION_LOCK_TABLE,
  MIGRATION_TABLE,
} from '../../migration/migration.js'
import { ColumnDataType } from '../../operation-node/data-type-node.js'

export class SqliteIntrospector implements DatabaseIntrospector {
  readonly #db: Kysely<any>

  constructor(db: Kysely<any>) {
    this.#db = db
  }

  async getMetadata(
    options: DatabaseMetadataOptions = { withInternalKyselyTables: false }
  ): Promise<DatabaseMetadata> {
    let query = this.#db
      .selectFrom('sqlite_schema')
      .where('type', '=', 'table')
      .where('name', 'not like', 'sqlite_%')
      .select('name')
      .castTo<{ name: string }>()

    if (!options.withInternalKyselyTables) {
      query = query
        .where('name', '!=', MIGRATION_TABLE)
        .where('name', '!=', MIGRATION_LOCK_TABLE)
    }

    const tables = await query.execute()

    return {
      tables: await Promise.all(
        tables.map(({ name }) => this.#getTableMetadata(name))
      ),
    }
  }

  async #getTableMetadata(table: string): Promise<TableMetadata> {
    const db = this.#db

    const columns = await db
      .selectFrom(db.raw(`PRAGMA_TABLE_INFO(?)`, [table]).as('table_info'))
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
