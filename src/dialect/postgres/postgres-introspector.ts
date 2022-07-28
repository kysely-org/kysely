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

export class PostgresIntrospector implements DatabaseIntrospector {
  readonly #db: Kysely<any>

  constructor(db: Kysely<any>) {
    this.#db = db
  }

  async getSchemas(): Promise<SchemaMetadata[]> {
    let rawSchemas = await this.#db
      .selectFrom('pg_catalog.pg_namespace')
      .select('nspname')
      .castTo<RawSchemaMetadata>()
      .execute()

    return rawSchemas.map((it) => ({ name: it.nspname }))
  }

  async getTables(
    options: DatabaseMetadataOptions = { withInternalKyselyTables: false }
  ): Promise<TableMetadata[]> {
    let query = this.#db
      .selectFrom('pg_catalog.pg_attribute as a')
      .innerJoin('pg_catalog.pg_class as c', 'a.attrelid', 'c.oid')
      .innerJoin('pg_catalog.pg_namespace as ns', 'c.relnamespace', 'ns.oid')
      .innerJoin('pg_catalog.pg_tables as t', (join) =>
        join
          .onRef('t.tablename', '=', 'c.relname')
          .onRef('t.schemaname', '=', 'ns.nspname')
      )
      .innerJoin('pg_catalog.pg_type as typ', 'a.atttypid', 'typ.oid')
      .select([
        'a.attname as column',
        'a.attnotnull as not_null',
        'a.atthasdef as has_default',
        't.tablename as table',
        't.schemaname as schema',
        'typ.typname as type',

        // Detect if the column is auto incrementing by finding the sequence
        // that is created for `serial` and `bigserial` columns.
        this.#db
          .selectFrom('pg_class')
          .select(sql`true`.as('auto_incrementing'))
          .where('relkind', '=', 'S')
          .where('relname', '=', sql`t.tablename || '_' || a.attname || '_seq'`)
          .as('auto_incrementing'),
      ])
      .where('t.schemaname', '!~', '^pg_')
      .where('t.schemaname', '!=', 'information_schema')
      .where('a.attnum', '>=', 0) // No system columns
      .where('a.attisdropped', '!=', true)
      .castTo<RawColumnMetadata>()

    if (!options.withInternalKyselyTables) {
      query = query
        .where('t.tablename', '!=', DEFAULT_MIGRATION_TABLE)
        .where('t.tablename', '!=', DEFAULT_MIGRATION_LOCK_TABLE)
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
      let table = tables.find(
        (tbl) => tbl.name === it.table && tbl.schema === it.schema
      )

      if (!table) {
        table = freeze({
          name: it.table,
          schema: it.schema,
          columns: [],
        })

        tables.push(table)
      }

      table.columns.push(
        freeze({
          name: it.column,
          dataType: it.type,
          isNullable: !it.not_null,
          isAutoIncrementing: !!it.auto_incrementing,
          hasDefaultValue: it.has_default,
        })
      )

      return tables
    }, [])
  }
}

interface RawSchemaMetadata {
  nspname: string
}

interface RawColumnMetadata {
  column: string
  table: string
  schema: string
  not_null: boolean
  has_default: boolean
  type: string
  auto_incrementing: boolean | null
}
