import { AlterTableNode } from '../operation-node/alter-table-node.js'
import { CreateIndexNode } from '../operation-node/create-index-node.js'
import { CreateSchemaNode } from '../operation-node/create-schema-node.js'
import { CreateTableNode } from '../operation-node/create-table-node.js'
import { DropIndexNode } from '../operation-node/drop-index-node.js'
import { DropSchemaNode } from '../operation-node/drop-schema-node.js'
import { DropTableNode } from '../operation-node/drop-table-node.js'
import { parseTable } from '../parser/table-parser.js'
import { WithSchemaTransformer } from '../transformers/with-schema-transformer.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { AlterTableBuilder } from './alter-table-builder.js'
import { CreateIndexBuilder } from './create-index-builder.js'
import { CreateSchemaBuilder } from './create-schema-builder.js'
import { CreateTableBuilder } from './create-table-builder.js'
import { DropIndexBuilder } from './drop-index-builder.js'
import { DropSchemaBuilder } from './drop-schema-builder.js'
import { DropTableBuilder } from './drop-table-builder.js'

/**
 * Provides methods for building database schema.
 */
export class SchemaModule {
  readonly #executor: QueryExecutor

  constructor(executor: QueryExecutor) {
    this.#executor = executor
  }

  /**
   * Create a new table.
   *
   * @example
   * This example creates a new table with columns `id`, `first_name`,
   * `last_name` and `gender`:
   *
   * ```ts
   * await db.schema
   *   .createTable('person')
   *   .addColumn('id', 'int', col => col.primaryKey().increments())
   *   .addColumn('first_name', 'varchar', col => col.notNull())
   *   .addColumn('last_name', 'varchar', col => col.notNull())
   *   .addColumn('gender', 'varchar')
   *   .execute()
   * ```
   */
  createTable(table: string): CreateTableBuilder {
    return new CreateTableBuilder({
      executor: this.#executor,
      createTableNode: CreateTableNode.create(parseTable(table)),
    })
  }

  /**
   * Drop a table.
   *
   * @example
   * ```ts
   * await db.schema
   *   .dropTable('person')
   *   .execute()
   * ```
   */
  dropTable(table: string): DropTableBuilder {
    return new DropTableBuilder({
      executor: this.#executor,
      dropTableNode: DropTableNode.create(parseTable(table)),
    })
  }

  /**
   * Create a new index.
   *
   * @example
   * ```ts
   * await db.schema
   *   .createIndex('person_full_name_unique_index')
   *   .on('person')
   *   .columns(['first_name', 'last_name'])
   *   .execute()
   * ```
   */
  createIndex(indexName: string): CreateIndexBuilder {
    return new CreateIndexBuilder({
      executor: this.#executor,
      createIndexNode: CreateIndexNode.create(indexName),
    })
  }

  /**
   * Drop an index.
   *
   * @example
   * ```ts
   * await db.schema
   *   .dropIndex('person_full_name_unique_index')
   *   .execute()
   * ```
   */
  dropIndex(indexName: string): DropIndexBuilder {
    return new DropIndexBuilder({
      executor: this.#executor,
      dropIndexNode: DropIndexNode.create(indexName),
    })
  }

  /**
   * Create a new schema.
   *
   * @example
   * ```ts
   * await db.schema
   *   .createSchema('some_schema')
   *   .execute()
   * ```
   */
  createSchema(schema: string): CreateSchemaBuilder {
    return new CreateSchemaBuilder({
      executor: this.#executor,
      createSchemaNode: CreateSchemaNode.create(schema),
    })
  }

  /**
   * Drop a schema.
   *
   * @example
   * ```ts
   * await db.schema
   *   .dropSchema('some_schema')
   *   .execute()
   * ```
   */
  dropSchema(schema: string): DropSchemaBuilder {
    return new DropSchemaBuilder({
      executor: this.#executor,
      dropSchemaNode: DropSchemaNode.create(schema),
    })
  }

  /**
   * Alter a table.
   *
   * @example
   * ```ts
   * await db.schema
   *   .alterTable('person')
   *   .alterColumn('first_name')
   *   .setDataType('text')
   *   .execute()
   * ```
   */
  alterTable(table: string): AlterTableBuilder {
    return new AlterTableBuilder({
      executor: this.#executor,
      alterTableNode: AlterTableNode.create(table),
    })
  }

  /**
   * See {@link QueryCreator.withSchema}
   */
  withSchema(schema: string): SchemaModule {
    return new SchemaModule(
      this.#executor.withTransformerAtFront(new WithSchemaTransformer(schema))
    )
  }
}
