import type {
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
import type { Kysely } from '../../kysely.js'
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
    options: DatabaseMetadataOptions = { withInternalKyselyTables: false },
  ): Promise<TableMetadata[]> {
    let query = this.#db
      .selectFrom('information_schema.columns as columns')
      .innerJoin('information_schema.tables as tables', (b) =>
        b
          .onRef('columns.TABLE_CATALOG', '=', 'tables.TABLE_CATALOG')
          .onRef('columns.TABLE_SCHEMA', '=', 'tables.TABLE_SCHEMA')
          .onRef('columns.TABLE_NAME', '=', 'tables.TABLE_NAME'),
      )
      .select([
        'columns.COLUMN_NAME',
        'columns.COLUMN_DEFAULT',
        'columns.TABLE_NAME',
        'columns.TABLE_SCHEMA',
        'tables.TABLE_TYPE',
        'tables.ENGINE',
        'columns.IS_NULLABLE',
        'columns.DATA_TYPE',
        'columns.EXTRA',
        'columns.COLUMN_COMMENT',
      ])
      .where('columns.TABLE_SCHEMA', '=', sql`database()`)
      .orderBy('columns.TABLE_NAME')
      .orderBy('columns.ORDINAL_POSITION')
      .$castTo<RawColumnMetadata>()

    if (!options.withInternalKyselyTables) {
      query = query
        .where('columns.TABLE_NAME', '!=', DEFAULT_MIGRATION_TABLE)
        .where('columns.TABLE_NAME', '!=', DEFAULT_MIGRATION_LOCK_TABLE)
    }

    const rawColumns = await query.execute()
    return this.#parseTableMetadata(rawColumns)
  }

  async getMetadata(
    options?: DatabaseMetadataOptions,
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
          isView: it.TABLE_TYPE === 'VIEW',
          isForeign: it.ENGINE === 'FEDERATED',
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
          comment: it.COLUMN_COMMENT === '' ? undefined : it.COLUMN_COMMENT,
        }),
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
  ENGINE: string
  IS_NULLABLE: 'YES' | 'NO'
  DATA_TYPE: string
  EXTRA: string
  COLUMN_COMMENT: string
}
