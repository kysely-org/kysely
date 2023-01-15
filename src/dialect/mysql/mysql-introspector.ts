import {
  DatabaseIntrospector,
  DatabaseMetadata,
  DatabaseMetadataOptions,
  SchemaMetadata,
  TableMetadata,
} from '../database-introspector.js'
import {
  DEFAULT_MIGRATION_LOCK_TABLE,
  DEFAULT_MIGRATION_TABLE,
} from '../../migration/migrator.js'
import { Kysely } from '../../kysely.js'
import { freeze } from '../../util/object-utils.js'
import { sql } from '../../raw-builder/sql.js'

export class MysqlIntrospector implements DatabaseIntrospector {
  readonly #db: Kysely<any>

  constructor(db: Kysely<any>) {
    this.#db = db
  }

  async getSchemas(): Promise<SchemaMetadata[]> {
    let rawSchemas = await this.#db
      .selectFrom('information_schema.schemata')
      .select('schema_name')
      .$castTo<RawSchemaMetadata>()
      .execute()

    return rawSchemas.map((it) => ({ name: it.SCHEMA_NAME }))
  }

  async getTables(
    options: DatabaseMetadataOptions = { withInternalKyselyTables: false }
  ): Promise<TableMetadata[]> {
    let query = this.#db
      .selectFrom('information_schema.columns')
      .innerJoin("information_schema.tables", 
        (b) => b.onRef("columns.TABLE_CATALOG", "=", "tables.TABLE_CATALOG")
                .onRef("columns.TABLE_SCHEMA", "=", "tables.TABLE_SCHEMA")
                .onRef("columns.TABLE_NAME", "=", "tables.TABLE_NAME")
      )
      .select([
        'columns.COLUMN_NAME',
        'columns.COLUMN_DEFAULT',
        'columns.TABLE_NAME',
        'columns.TABLE_SCHEMA',
        'tables.TABLE_TYPE',
        'columns.IS_NULLABLE',
        'columns.DATA_TYPE',
        'columns.EXTRA',
      ])
      .where('columns.table_schema', '=', sql`database()`)
      .orderBy('columns.table_name')
      .orderBy('columns.ordinal_position')
      .$castTo<RawColumnMetadata>()

    if (!options.withInternalKyselyTables) {
      query = query
        .where('columns.table_name' as string, '!=', DEFAULT_MIGRATION_TABLE)
        .where('columns.table_name' as string, '!=', DEFAULT_MIGRATION_LOCK_TABLE)
    }

    const rawColumns = await query.execute()
    return this.#parseTableMetadata(rawColumns)
  }

  async getMetadata(
    options?: DatabaseMetadataOptions
  ): Promise<DatabaseMetadata> {
    return {
      tables: await this.getTables(options),
    }
  }

  #parseTableMetadata(columns: RawColumnMetadata[]): TableMetadata[] {
    return columns.reduce<TableMetadata[]>((tables, it) => {
      let table = tables.find((tbl) => tbl.name === it.TABLE_NAME)

      if (!table) {
        table = freeze({
          name: it.TABLE_NAME,
          isView: it.TABLE_TYPE === "VIEW",
          schema: it.TABLE_SCHEMA,
          columns: [],
        })

        tables.push(table)
      }

      table.columns.push(
        freeze({
          name: it.COLUMN_NAME,
          dataType: it.DATA_TYPE,
          isNullable: it.IS_NULLABLE === 'YES',
          isAutoIncrementing: it.EXTRA.toLowerCase().includes('auto_increment'),
          hasDefaultValue: it.COLUMN_DEFAULT !== null,
        })
      )

      return tables
    }, [])
  }
}

interface RawSchemaMetadata {
  SCHEMA_NAME: string
}

interface RawColumnMetadata {
  COLUMN_NAME: string
  COLUMN_DEFAULT: any
  TABLE_NAME: string
  TABLE_SCHEMA: string
  TABLE_TYPE: string
  IS_NULLABLE: 'YES' | 'NO'
  DATA_TYPE: string
  EXTRA: string
}
