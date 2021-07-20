import { createIndexNode } from '../operation-node/create-index-node'
import { createTableNode } from '../operation-node/create-table-node'
import { dropIndexNode } from '../operation-node/drop-index-node'
import { dropTableNode } from '../operation-node/drop-table-node'
import { parseTable } from '../parser/table-parser'
import { freeze } from '../util/object-utils'
import { QueryExecutor } from '../util/query-executor'
import { CreateIndexBuilder } from './create-index-builder'
import { CreateTableBuilder } from './create-table-builder'
import { DropIndexBuilder } from './drop-index-builder'
import { DropTableBuilder } from './drop-table-builder'

/**
 * Provides methods for building database schema.
 */
export interface Schema {
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
   *   .integer('id', col => col.primary().increments())
   *   .string('first_name', col => col.notNullable())
   *   .string('last_name', col => col.notNullable())
   *   .string('gender')
   *   .execute()
   * ```
   */
  createTable(table: string): CreateTableBuilder

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
  dropTable(table: string): DropTableBuilder

  /**
   * Drop a table if it exists. Does nothing if it doesn't.
   *
   * @example
   * ```ts
   * await db.schema
   *   .dropTableIfExists('person')
   *   .execute()
   * ```
   */
  dropTableIfExists(table: string): DropTableBuilder

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
  createIndex(indexName: string): CreateIndexBuilder

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
  dropIndex(indexName: string): DropIndexBuilder

  /**
   * Drop an index if it exists. Does nothing if it doesn't.
   *
   * @example
   * ```ts
   * await db.schema
   *   .dropIndexIfExists('person_full_name_unique_index')
   *   .execute()
   * ```
   */
  dropIndexIfExists(indexName: string): DropIndexBuilder
}

export function createSchemaModule(executor: QueryExecutor): Schema {
  return freeze({
    createTable(table: string): CreateTableBuilder {
      return new CreateTableBuilder({
        executor,
        createTableNode: createTableNode.create(parseTable(table)),
      })
    },

    dropTable(table: string): DropTableBuilder {
      return new DropTableBuilder({
        executor,
        dropTableNode: dropTableNode.create(parseTable(table)),
      })
    },

    dropTableIfExists(table: string): DropTableBuilder {
      return new DropTableBuilder({
        executor,
        dropTableNode: dropTableNode.create(parseTable(table), {
          modifier: 'IfExists',
        }),
      })
    },

    createIndex(name: string): CreateIndexBuilder {
      return new CreateIndexBuilder({
        executor,
        createIndexNode: createIndexNode.create(name),
      })
    },

    dropIndex(indexName: string): DropIndexBuilder {
      return new DropIndexBuilder({
        executor,
        dropIndexNode: dropIndexNode.create(indexName),
      })
    },

    dropIndexIfExists(indexName: string): DropIndexBuilder {
      return new DropIndexBuilder({
        executor,
        dropIndexNode: dropIndexNode.create(indexName, {
          modifier: 'IfExists',
        }),
      })
    },
  })
}
