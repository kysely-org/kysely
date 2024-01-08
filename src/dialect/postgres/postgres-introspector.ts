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
      .$castTo<RawSchemaMetadata>()
      .execute()

    return rawSchemas.map((it) => ({ name: it.nspname }))
  }

  async getTables(
    options: DatabaseMetadataOptions = { withInternalKyselyTables: false }
  ): Promise<TableMetadata[]> {
    let query = this.#db
      // column
      .selectFrom('pg_catalog.pg_attribute as a')
      // table
      .innerJoin('pg_catalog.pg_class as c', 'a.attrelid', 'c.oid')
      // table schema
      .innerJoin('pg_catalog.pg_namespace as ns', 'c.relnamespace', 'ns.oid')
      // column data type
      .innerJoin('pg_catalog.pg_type as typ', 'a.atttypid', 'typ.oid')
      // column data type schema
      .innerJoin(
        'pg_catalog.pg_namespace as dtns',
        'typ.typnamespace',
        'dtns.oid'
      )
      .select([
        'a.attname as column',
        'a.attnotnull as not_null',
        'a.atthasdef as has_default',
        'c.relname as table',
        'c.relkind as table_type',
        'ns.nspname as schema',
        'typ.typname as type',
        'dtns.nspname as type_schema',

        // Detect if the column is auto incrementing by finding the sequence
        // that is created for `serial` and `bigserial` columns.
        this.#db
          .selectFrom('pg_class')
          .select(sql`true`.as('auto_incrementing'))
          // Make sure the sequence is in the same schema as the table.
          .whereRef('relnamespace', '=', 'c.relnamespace')
          .where('relkind', '=', 'S')
          .where('relname', '=', sql`c.relname || '_' || a.attname || '_seq'`)
          .as('auto_incrementing'),
      ])
      // r == normal table
      .where((eb) =>
        eb.or([eb('c.relkind', '=', 'r'), eb('c.relkind', '=', 'v')])
      )
      .where('ns.nspname', '!~', '^pg_')
      .where('ns.nspname', '!=', 'information_schema')
      // No system columns
      .where('a.attnum', '>=', 0)
      .where('a.attisdropped', '!=', true)
      .orderBy('ns.nspname')
      .orderBy('c.relname')
      .orderBy('a.attnum')
      .$castTo<RawColumnMetadata>()

    if (!options.withInternalKyselyTables) {
      query = query
        .where('c.relname', '!=', DEFAULT_MIGRATION_TABLE)
        .where('c.relname', '!=', DEFAULT_MIGRATION_LOCK_TABLE)
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
          isView: it.table_type === 'v',
          schema: it.schema,
          columns: [],
        })

        tables.push(table)
      }

      table.columns.push(
        freeze({
          name: it.column,
          dataType: it.type,
          dataTypeSchema: it.type_schema,
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
  table_type: string
  schema: string
  not_null: boolean
  has_default: boolean
  type: string
  type_schema: string
  auto_incrementing: boolean | null
}
