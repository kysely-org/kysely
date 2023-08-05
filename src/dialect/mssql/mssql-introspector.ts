import { Kysely } from '../../kysely.js'
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
import { freeze } from '../../util/object-utils.js'

export class MssqlIntrospector implements DatabaseIntrospector {
  readonly #db: Kysely<MssqlSysTables>

  constructor(db: Kysely<any>) {
    this.#db = db
  }

  async getSchemas(): Promise<SchemaMetadata[]> {
    return await this.#db.selectFrom('sys.schemas').select('name').execute()
  }

  async getTables(
    options: DatabaseMetadataOptions = { withInternalKyselyTables: false }
  ): Promise<TableMetadata[]> {
    const rawColumns = await this.#db
      .selectFrom('sys.tables as tables')
      .leftJoin(
        'sys.schemas as table_schemas',
        'table_schemas.schema_id',
        'tables.schema_id'
      )
      .innerJoin(
        'sys.columns as columns',
        'columns.object_id',
        'tables.object_id'
      )
      .innerJoin(
        'sys.types as types',
        'types.system_type_id',
        'columns.system_type_id'
      )
      .leftJoin(
        'sys.schemas as type_schemas',
        'type_schemas.schema_id',
        'types.schema_id'
      )
      .$if(!options.withInternalKyselyTables, (qb) =>
        qb
          .where('tables.name', '!=', DEFAULT_MIGRATION_TABLE)
          .where('tables.name', '!=', DEFAULT_MIGRATION_LOCK_TABLE)
      )
      .select([
        'tables.name as table_name',
        (eb) =>
          eb
            .ref('tables.type')
            .$castTo<
              | MssqlSysTables['sys.tables']['type']
              | MssqlSysTables['sys.views']['type']
            >()
            .as('table_type'),
        'table_schemas.name as table_schema_name',
        'columns.default_object_id as column_default_object_id',
        'columns.generated_always_type_desc as column_generated_always_type',
        'columns.is_computed as column_is_computed',
        'columns.is_identity as column_is_identity',
        'columns.is_nullable as column_is_nullable',
        'columns.is_rowguidcol as column_is_rowguidcol',
        'columns.name as column_name',
        'types.is_nullable as type_is_nullable',
        'types.name as type_name',
        'type_schemas.name as type_schema_name',
      ])
      .unionAll(
        this.#db
          .selectFrom('sys.views as views')
          .leftJoin(
            'sys.schemas as view_schemas',
            'view_schemas.schema_id',
            'views.schema_id'
          )
          .innerJoin(
            'sys.columns as columns',
            'columns.object_id',
            'views.object_id'
          )
          .innerJoin(
            'sys.types as types',
            'types.system_type_id',
            'columns.system_type_id'
          )
          .leftJoin(
            'sys.schemas as type_schemas',
            'type_schemas.schema_id',
            'types.schema_id'
          )
          .select([
            'views.name as table_name',
            'views.type as table_type',
            'view_schemas.name as table_schema_name',
            'columns.default_object_id as column_default_object_id',
            'columns.generated_always_type_desc as column_generated_always_type',
            'columns.is_computed as column_is_computed',
            'columns.is_identity as column_is_identity',
            'columns.is_nullable as column_is_nullable',
            'columns.is_rowguidcol as column_is_rowguidcol',
            'columns.name as column_name',
            'types.is_nullable as type_is_nullable',
            'types.name as type_name',
            'type_schemas.name as type_schema_name',
          ])
      )
      .orderBy('table_schema_name')
      .orderBy('table_name')
      .orderBy('column_name')
      .execute()

    const tableDictionary: Record<string, TableMetadata> = {}

    for (const rawColumn of rawColumns) {
      const key = `${rawColumn.table_schema_name}.${rawColumn.table_name}`

      const table = (tableDictionary[key] ||= freeze({
        columns: [],
        isView: rawColumn.table_type === 'V ',
        name: rawColumn.table_name,
        schema: rawColumn.table_schema_name ?? undefined,
      }))

      table.columns.push(
        freeze({
          dataType: rawColumn.type_name,
          dataTypeSchema: rawColumn.type_schema_name ?? undefined,
          hasDefaultValue:
            rawColumn.column_default_object_id > 0 ||
            rawColumn.column_generated_always_type !== 'NOT_APPLICABLE' ||
            rawColumn.column_is_computed ||
            rawColumn.column_is_rowguidcol,
          isAutoIncrementing: rawColumn.column_is_identity,
          isNullable:
            rawColumn.column_is_nullable && rawColumn.type_is_nullable,
          name: rawColumn.column_name,
        })
      )
    }

    return Object.values(tableDictionary)
  }

  async getMetadata(
    options?: DatabaseMetadataOptions
  ): Promise<DatabaseMetadata> {
    return {
      tables: await this.getTables(options),
    }
  }
}

interface MssqlSysTables {
  'sys.columns': {
    // collation_name: string | null
    // column_encryption_key_database_name: null
    // column_encryption_key_id: null
    column_id: number
    default_object_id: number
    // encryption_algorithm_name: null
    // encryption_type: null
    // encryption_type_desc: null
    // generated_always_type: number
    generated_always_type_desc: string
    // graph_type: number
    // graph_type_desc: string
    // is_ansi_padded: boolean
    // is_column_set: boolean
    is_computed: boolean
    // is_data_deletion_filter_column: boolean
    // is_dropped_ledger_column: boolean
    // is_dts_replicated: boolean
    // is_filestream: boolean
    // is_hidden: boolean
    is_identity: boolean
    // is_masked: boolean
    // is_merge_published: boolean
    // is_non_sql_subscribed: boolean
    is_nullable: boolean
    // is_replicated: boolean
    is_rowguidcol: boolean
    // is_sparse: boolean
    // is_xml_document: boolean
    // ledger_view_column_type: null
    // ledger_view_column_type_desc: null
    // max_length: number
    name: string
    object_id: number
    // precision: number
    // rule_object_id: number
    // scale: number
    system_type_id: number
  }
  'sys.schemas': {
    name: string
    // principal_id: number
    schema_id: number
  }
  'sys.tables': {
    // create_date: Date
    // data_retention_period: number
    // data_retention_period_unit: number
    // data_retention_period_unit_desc: string
    // durability: number
    // durability_desc: string
    // filestream_data_space_id: number | null
    // has_replication_filter: boolean
    // has_unchecked_assembly_data: boolean
    // history_retention_period: null
    // history_retention_period_unit: null
    // history_retention_period_unit_desc: null
    // history_table_id: null
    // is_dropped_ledger_table: boolean
    // is_edge: boolean
    // is_external: boolean
    // is_filetable: boolean
    // is_memory_optimized: boolean
    // is_merge_published: boolean
    // is_ms_shipped: boolean
    // is_node: boolean
    // is_published: boolean
    // is_remote_data_archive_enabled: boolean
    // is_replicated: boolean
    // is_schema_published: boolean
    // is_sync_tran_subscribed: boolean
    // is_tracked_by_cdc: boolean
    // large_value_types_out_of_row: boolean
    // ledger_type: number
    // ledger_type_desc: string
    // ledger_view_id: null
    // lob_data_space_id: number
    // lock_escalation: number
    // lock_escalation_desc: string
    // lock_on_bulk_load: boolean
    // max_column_id_used: number
    // modify_date: Date
    name: string
    object_id: number
    // parent_object_id: number
    // principal_id: number | null
    schema_id: number
    // temporal_type: number
    // temporal_type_desc: string
    // text_in_row_limit: number
    type: 'U '
    // type_desc: 'USER_TABLE'
    // uses_ansi_nulls: boolean
  }
  'sys.types': {
    // collation_name: string | null
    // default_object_id: number
    // is_assembly_type: boolean
    is_nullable: boolean
    // is_table_type: boolean
    // is_user_defined: boolean
    // max_length: number
    name: string
    // precision: number
    // principal_id: number | null
    // rule_object_id: number
    // scale: number
    schema_id: number
    system_type_id: number
    // user_type_id: number
  }
  'sys.views': {
    // create_date: Date
    // has_opaque_metadata: boolean
    // has_replication_filter: boolean
    // has_snapshot: boolean
    // has_unchecked_assembly_data: boolean
    // is_date_correlation_view: boolean
    // is_dropped_ledger_view: boolean
    // is_msh_shipped: boolean
    // is_published: boolean
    // is_replicated: boolean
    // is_schema_published: boolean
    // is_tracked_by_cdc: boolean
    // ledger_view_type: number
    // ledger_view_type_desc: string
    // modify_date: Date
    name: string
    object_id: number
    // parent_object_id: number
    // principal_id: number | null
    schema_id: number
    type: 'V '
    // type_desc: 'VIEW'
    // with_check_option: boolean
  }
}
