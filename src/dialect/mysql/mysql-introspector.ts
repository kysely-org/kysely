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
import { ColumnDataType } from '../../operation-node/data-type-node.js'
import { freeze } from '../../util/object-utils.js'

export class MysqlIntrospector implements DatabaseIntrospector {
  readonly #db: Kysely<any>

  constructor(db: Kysely<any>) {
    this.#db = db
  }

  async getSchemas(): Promise<SchemaMetadata[]> {
    let rawSchemas = await this.#db
      .selectFrom('information_schema.schemata')
      .select('schema_name')
      .castTo<RawSchemaMetadata>()
      .execute()

    return rawSchemas.map((it) => ({ name: it.SCHEMA_NAME }))
  }

  async getTables(
    options: DatabaseMetadataOptions = { withInternalKyselyTables: false }
  ): Promise<TableMetadata[]> {
    let query = this.#db
      .selectFrom('information_schema.columns')
      .select([
        'column_name',
        'table_name',
        'table_schema',
        'is_nullable',
        'data_type',
      ])
      .where('table_schema', 'not in', [
        'information_schema',
        'performance_schema',
        'mysql',
        'sys',
      ])
      .castTo<RawColumnMetadata>()

    if (!options.withInternalKyselyTables) {
      query = query
        .where('table_name', '!=', DEFAULT_MIGRATION_TABLE)
        .where('table_name', '!=', DEFAULT_MIGRATION_LOCK_TABLE)
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
  TABLE_NAME: string
  TABLE_SCHEMA: string
  IS_NULLABLE: 'YES' | 'NO'
  DATA_TYPE: ColumnDataType
}
