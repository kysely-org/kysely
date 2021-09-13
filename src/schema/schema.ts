import { createIndexNode } from '../operation-node/create-index-node'
import { createSchemaNode } from '../operation-node/create-schema-node'
import { createTableNode } from '../operation-node/create-table-node'
import { dropIndexNode } from '../operation-node/drop-index-node'
import { dropSchemaNode } from '../operation-node/drop-schema-node'
import { dropTableNode } from '../operation-node/drop-table-node'
import { parseTable } from '../parser/table-parser'
import { WithSchemaTransformer } from '../transformers/with-schema-transformer'
import { QueryExecutor } from '../util/query-executor'
import { CreateIndexBuilder } from './create-index-builder'
import { CreateSchemaBuilder } from './create-schema-builder'
import { CreateTableBuilder } from './create-table-builder'
import { DropIndexBuilder } from './drop-index-builder'
import { DropSchemaBuilder } from './drop-schema-builder'
import { DropTableBuilder } from './drop-table-builder'

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
   *   .addColumn('int', 'id', col => col.primaryKey().increments())
   *   .addColumn('varchar', 'first_name', col => col.notNullable())
   *   .addColumn('varchar', 'last_name', col => col.notNullable())
   *   .addColumn('varchar', 'gender')
   *   .execute()
   * ```
   */
  createTable(table: string): CreateTableBuilder {
    return new CreateTableBuilder({
      executor: this.#executor,
      createTableNode: createTableNode.create(parseTable(table)),
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
      dropTableNode: dropTableNode.create(parseTable(table)),
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
      createIndexNode: createIndexNode.create(indexName),
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
      dropIndexNode: dropIndexNode.create(indexName),
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
      createSchemaNode: createSchemaNode.create(schema),
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
      dropSchemaNode: dropSchemaNode.create(schema),
    })
  }

  /**
   * See {@link QueryCreator.withSchema}
   */
  withSchema(schema: string): SchemaModule {
    return new SchemaModule(
      this.#executor.copyWithTransformerAtFront(
        new WithSchemaTransformer(schema)
      )
    )
  }
}
