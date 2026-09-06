import type {
  DatabaseIntrospector,
  DatabaseMetadataOptions,
  DatabaseSchemaMetadataOptions,
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

const SYSTEM_DATABASES = [
  'information_schema',
  'mysql',
  'performance_schema',
  'sys',
  'ndbinfo',
] as const

export class MysqlIntrospector implements DatabaseIntrospector {
  readonly #db: Kysely<any>

  constructor(db: Kysely<any>) {
    this.#db = db
  }

  async getSchemas(
    options: DatabaseSchemaMetadataOptions = {},
  ): Promise<SchemaMetadata[]> {
    let query = this.#db
      .selectFrom('information_schema.schemata')
      .select('schema_name as name')
      .$narrowType<SchemaMetadata>()

    if (options.where) {
      query = query.where(
        options.where({ schema: sql.ref<string>('schema_name') }),
      )
    }

    return await query.execute()
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
        'tables.TABLE_COMMENT',
        'tables.ENGINE',
        'columns.IS_NULLABLE',
        'columns.DATA_TYPE',
        'columns.EXTRA',
        'columns.COLUMN_COMMENT',
      ])
      .where('columns.TABLE_SCHEMA', 'not in', SYSTEM_DATABASES)
      .orderBy('columns.TABLE_SCHEMA')
      .orderBy('columns.TABLE_NAME')
      .orderBy('columns.ORDINAL_POSITION')
      .$castTo<RawColumnMetadata>()

    if (!options.withNonDefaultDatabases) {
      query = query.where('columns.TABLE_SCHEMA', '=', sql`database()`)
    }

    if (!options.withInternalKyselyTables) {
      query = query
        .where('columns.TABLE_NAME', '!=', DEFAULT_MIGRATION_TABLE)
        .where('columns.TABLE_NAME', '!=', DEFAULT_MIGRATION_LOCK_TABLE)
    }

    if (options.where) {
      query = query.where(
        options.where({
          schema: sql.ref<string>('columns.TABLE_SCHEMA'),
          table: sql.ref<string>('columns.TABLE_NAME'),
        }),
      )
    }

    const rawColumns = await query.execute()
    return this.#parseTableMetadata(rawColumns)
  }

  #parseTableMetadata(columns: RawColumnMetadata[]): TableMetadata[] {
    return columns.reduce<TableMetadata[]>((tables, it) => {
      let table = tables.find(
        (tbl) => tbl.name === it.TABLE_NAME && tbl.schema === it.TABLE_SCHEMA,
      )

      if (!table) {
        table = freeze({
          columns: [],
          comment:
            it.TABLE_TYPE === 'VIEW' || it.TABLE_COMMENT === ''
              ? undefined
              : it.TABLE_COMMENT,
          isForeign: it.ENGINE === 'FEDERATED',
          isView: it.TABLE_TYPE === 'VIEW',
          name: it.TABLE_NAME,
          schema: it.TABLE_SCHEMA,
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

interface RawColumnMetadata {
  COLUMN_NAME: string
  COLUMN_DEFAULT: any
  TABLE_NAME: string
  TABLE_SCHEMA: string
  TABLE_TYPE: string
  TABLE_COMMENT: string
  ENGINE: string
  IS_NULLABLE: 'YES' | 'NO'
  DATA_TYPE: string
  EXTRA: string
  COLUMN_COMMENT: string
}
