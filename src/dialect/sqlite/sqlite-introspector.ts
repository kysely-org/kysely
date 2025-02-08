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

interface SqliteSystemDatabase {
  // https://www.sqlite.org/schematab.html#alternative_names
  sqlite_master: SQliteMasterTable
}

// https://www.sqlite.org/schematab.html#interpretation_of_the_schema_table
interface SQliteMasterTable {
  name: string
  rootpage: number | null
  sql: string
  tbl_name: string
  type: 'index' | 'table' | 'trigger' | 'view'
}

// https://www.sqlite.org/pragma.html#pragma_table_info
interface PragmaTableInfo {
  cid: number
  dflt_value: unknown
  name: string
  notnull: 0 | 1
  pk: number
  type: string
}

export class SqliteIntrospector implements DatabaseIntrospector {
  readonly #db: Kysely<SqliteSystemDatabase>

  constructor(db: Kysely<any>) {
    this.#db = db
  }

  async getSchemas(): Promise<SchemaMetadata[]> {
    // Sqlite doesn't support schemas.
    return []
  }

  async getTables(
    options: DatabaseMetadataOptions = { withInternalKyselyTables: false },
  ): Promise<TableMetadata[]> {
    return await this.#getTableMetadata(options)
  }

  async getMetadata(
    options?: DatabaseMetadataOptions,
  ): Promise<DatabaseMetadata> {
    return {
      tables: await this.getTables(options),
    }
  }

  #metaQuery(table: string) {
    return this.#db
      .selectFrom(
        sql<PragmaTableInfo>`pragma_table_info(${table})`.as('table_info'),
      )
      .select([
        sql.val(table).as('table'),
        'cid',
        'name',
        'type',
        'notnull',
        'dflt_value',
        'pk',
      ])
  }

  async #getTableMetadata(
    options: DatabaseMetadataOptions,
  ): Promise<TableMetadata[]> {
    let tablesQuery = this.#db
      .selectFrom('sqlite_master')
      .where('type', 'in', ['table', 'view'])
      .where('name', 'not like', 'sqlite_%')
      .select(['name', 'sql', 'type'])
      .orderBy('name')

    if (!options.withInternalKyselyTables) {
      tablesQuery = tablesQuery
        .where('name', '!=', DEFAULT_MIGRATION_TABLE)
        .where('name', '!=', DEFAULT_MIGRATION_LOCK_TABLE)
    }

    const tablesResult = await tablesQuery.execute()
    const [firstTable, ...otherTables] = tablesResult

    if (!firstTable) {
      return []
    }

    let metadataQuery = this.#metaQuery(firstTable.name)
    for (const otherTable of otherTables) {
      metadataQuery = metadataQuery.unionAll(this.#metaQuery(otherTable.name))
    }
    const tableMetadata = await metadataQuery
      .orderBy(['table', 'cid'])
      .execute()

    const columnsByTable: Record<string, typeof tableMetadata> = {}
    for (const row of tableMetadata) {
      columnsByTable[row.table] ??= []
      columnsByTable[row.table].push(row)
    }

    return tablesResult.map(({ name, sql, type }) => {
      // // Try to find the name of the column that has `autoincrement` 🤦
      let autoIncrementCol = sql
        ?.split(/[\(\),]/)
        ?.find((it) => it.toLowerCase().includes('autoincrement'))
        ?.trimStart()
        ?.split(/\s+/)?.[0]
        ?.replace(/["`]/g, '')

      const columns = columnsByTable[name] ?? []

      // Otherwise, check for an INTEGER PRIMARY KEY
      // https://www.sqlite.org/autoinc.html
      if (!autoIncrementCol) {
        const pkCols = columns.filter((r) => r.pk > 0)
        if (pkCols.length === 1 && pkCols[0].type.toLowerCase() === 'integer') {
          autoIncrementCol = pkCols[0].name
        }
      }

      return {
        name: name,
        isView: type === 'view',
        columns: columns.map((col) => ({
          name: col.name,
          dataType: col.type,
          isNullable: !col.notnull,
          isAutoIncrementing: col.name === autoIncrementCol,
          hasDefaultValue: col.dflt_value != null,
          comment: undefined,
        })),
      }
    })
  }
}
