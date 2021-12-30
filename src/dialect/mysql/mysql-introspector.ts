import {
  DatabaseIntrospector,
  DatabaseMetadata,
  DatabaseMetadataOptions,
  TableMetadata,
} from '../database-introspector.js'
import {
  MIGRATION_LOCK_TABLE,
  MIGRATION_TABLE,
} from '../../migration/migration.js'
import { Kysely } from '../../kysely.js'
import { ColumnDataType } from '../../operation-node/data-type-node.js'
import { freeze } from '../../util/object-utils.js'

export class MysqlIntrospector implements DatabaseIntrospector {
  readonly #db: Kysely<any>

  constructor(db: Kysely<any>) {
    this.#db = db
  }

  async getMetadata(
    options: DatabaseMetadataOptions = { withInternalKyselyTables: false }
  ): Promise<DatabaseMetadata> {
    let query = this.#db
      .selectFrom('information_schema.columns')
      .selectAll()
      .where('table_schema', '=', this.#db.raw('database()'))
      .castTo<RawColumnMetadata>()

    if (!options.withInternalKyselyTables) {
      query = query
        .where('table_name', '!=', MIGRATION_TABLE)
        .where('table_name', '!=', MIGRATION_LOCK_TABLE)
    }

    const rawColumns = await query.execute()

    return {
      tables: this.#parseTableMetadata(rawColumns),
    }
  }

  #parseTableMetadata(columns: RawColumnMetadata[]): TableMetadata[] {
    return columns.reduce<TableMetadata[]>((tables, it) => {
      let table = tables.find((tbl) => tbl.name === it.TABLE_NAME)

      if (!table) {
        table = freeze({
          name: it.TABLE_NAME,
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

interface RawColumnMetadata {
  COLUMN_NAME: string
  TABLE_NAME: string
  IS_NULLABLE: 'YES' | 'NO'
  DATA_TYPE: ColumnDataType
}
