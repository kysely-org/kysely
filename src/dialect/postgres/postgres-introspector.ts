import type {
  DatabaseIntrospector,
  DatabaseMetadataOptions,
  SchemaMetadata,
  TableMetadata,
  TypeMetadata,
  TypeMetadataKind,
} from '../database-introspector.js'
import {
  DEFAULT_MIGRATION_LOCK_TABLE,
  DEFAULT_MIGRATION_TABLE,
} from '../../migration/migrator.js'
import type { Kysely } from '../../kysely.js'
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

  async getTypes(): Promise<TypeMetadata[]> {
    const rawTypes = await this.#db
      .selectFrom('pg_catalog.pg_type as typ')
      .innerJoin('pg_catalog.pg_namespace as ns', 'typ.typnamespace', 'ns.oid')
      .leftJoin('pg_catalog.pg_type as base', 'typ.typbasetype', 'base.oid')
      .leftJoin(
        'pg_catalog.pg_namespace as basens',
        'base.typnamespace',
        'basens.oid',
      )
      .leftJoin('pg_catalog.pg_enum as enum', 'typ.oid', 'enum.enumtypid')
      .select([
        'typ.typname as name',
        'ns.nspname as schema',
        'typ.typtype as type_kind',
        'typ.typcategory as type_category',
        'base.typname as base_type',
        'basens.nspname as base_type_schema',
        'enum.enumlabel as enum_value',
        'enum.enumsortorder as enum_sort_order',
      ])
      .where('ns.nspname', 'not in', ['pg_catalog', 'information_schema'])
      .orderBy('ns.nspname')
      .orderBy('typ.typname')
      .orderBy('enum.enumsortorder')
      .$castTo<RawTypeMetadata>()
      .execute()

    const types: TypeMetadata[] = []

    for (const rawType of rawTypes) {
      let type = types.find(
        (it) => it.name === rawType.name && it.schema === rawType.schema,
      )

      if (!type) {
        type = {
          name: rawType.name,
          schema: rawType.schema,
          kind: parseTypeKind(rawType.type_kind, rawType.type_category),
          ...(rawType.base_type && { baseType: rawType.base_type }),
          ...(rawType.base_type_schema && {
            baseTypeSchema: rawType.base_type_schema,
          }),
          ...(rawType.enum_value && { values: [] }),
        }

        types.push(type)
      }

      if (rawType.enum_value) {
        type.values?.push(rawType.enum_value)
      }
    }

    return types
  }

  async getTables(
    options: DatabaseMetadataOptions = { withInternalKyselyTables: false },
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
        'dtns.oid',
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
        sql<string | null>`col_description(a.attrelid, a.attnum)`.as(
          'column_description',
        ),
        sql<
          string | null
        >`pg_get_serial_sequence(quote_ident(ns.nspname) || '.' || quote_ident(c.relname), a.attname)`.as(
          'auto_incrementing',
        ),
      ])
      .where('c.relkind', 'in', [
        'r' /*regular table*/,
        'v' /*view*/,
        'p' /*partitioned table*/,
        'f' /*foreign table*/,
      ])
      .where('ns.nspname', '!~', '^pg_')
      .where('ns.nspname', '!=', 'information_schema')
      // Filter out internal cockroachdb schema
      .where('ns.nspname', '!=', 'crdb_internal')
      // Only schemas where we are allowed access
      .where(sql<boolean>`has_schema_privilege(ns.nspname, 'USAGE')`)
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

  #parseTableMetadata(columns: RawColumnMetadata[]): TableMetadata[] {
    const tables: TableMetadata[] = []
    const schemas = new Map<string, Map<string, TableMetadata>>()

    for (const column of columns) {
      let schema = schemas.get(column.schema)

      if (!schema) {
        schema = new Map<string, TableMetadata>()
        schemas.set(column.schema, schema)
      }

      let table = schema.get(column.table)

      if (!table) {
        table = freeze({
          columns: [],
          isForeign: column.table_type === 'f',
          isView: column.table_type === 'v',
          name: column.table,
          schema: column.schema,
        })
        schema.set(column.table, table)
        tables.push(table)
      }

      table.columns.push(
        freeze({
          comment: column.column_description ?? undefined,
          dataType: column.type,
          dataTypeSchema: column.type_schema,
          hasDefaultValue: column.has_default,
          isAutoIncrementing: column.auto_incrementing !== null,
          isNullable: !column.not_null,
          name: column.column,
        }),
      )
    }

    return tables
  }
}

interface RawSchemaMetadata {
  nspname: string
}

interface RawTypeMetadata {
  name: string
  schema: string
  type_kind: string
  type_category: string
  base_type: string | null
  base_type_schema: string | null
  enum_value: string | null
  enum_sort_order: number | null
}

function parseTypeKind(
  typeKind: string,
  typeCategory: string,
): TypeMetadataKind {
  if (typeCategory === 'A') {
    return 'array'
  }

  switch (typeKind) {
    case 'b':
      return 'base'
    case 'c':
      return 'composite'
    case 'd':
      return 'domain'
    case 'e':
      return 'enum'
    case 'm':
      return 'multirange'
    case 'p':
      return 'pseudo'
    case 'r':
      return 'range'
    default:
      return 'unknown'
  }
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
  auto_incrementing: string | null
  column_description: string | null
}
