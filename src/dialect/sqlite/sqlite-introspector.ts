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
import { QueryCreator } from '../../query-creator.js'

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

// https://www.sqlite.org/pragma.html#pragma_table_xinfo
interface PragmaTableInfo {
  cid: number
  dflt_value: unknown
  name: string
  notnull: 0 | 1
  pk: number
  type: string
  hidden: 0 | 1 | 2 | 3
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

  #tablesQuery(
    qb: QueryCreator<SqliteSystemDatabase> | Kysely<SqliteSystemDatabase>,
    options: DatabaseMetadataOptions,
  ) {
    let tablesQuery = qb
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
    return tablesQuery
  }

  async #getTableMetadata(
    options: DatabaseMetadataOptions,
  ): Promise<TableMetadata[]> {
    const tablesResult = await this.#tablesQuery(this.#db, options).execute()

    const tableMetadata = await this.#db
      .with('table_list', (qb) => this.#tablesQuery(qb, options))
      .selectFrom([
        'table_list as tl',
        sql<PragmaTableInfo>`pragma_table_xinfo(tl.name)`.as('p'),
      ])
      .select([
        'tl.name as table',
        'p.cid',
        'p.name',
        'p.type',
        'p.notnull',
        'p.dflt_value',
        'p.pk',
      ])
      .where('p.hidden', '<>', 1)
      .orderBy(['tl.name', 'p.cid'])
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
