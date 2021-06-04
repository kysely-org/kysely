import { ConnectionProvider } from '../driver/connection-provider'
import { createCreateTableNode } from '../operation-node/create-table-node'
import { createDropTableNode } from '../operation-node/drop-table-node'
import { parseTable } from '../parser/table-parser'
import { QueryCompiler } from '../query-compiler/query-compiler'
import { freeze } from '../util/object-utils'
import { CreateTableBuilder } from './create-table-builder'
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
   *   .string('gender', col => col.notNullable())
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
}

export function createSchemaObject(
  compiler: QueryCompiler,
  connectionProvider: ConnectionProvider
): Schema {
  return freeze({
    createTable(table: string): CreateTableBuilder {
      return new CreateTableBuilder({
        compiler,
        connectionProvider,
        createTableNode: createCreateTableNode(parseTable(table)),
      })
    },

    dropTable(table: string): DropTableBuilder {
      return new DropTableBuilder({
        compiler,
        connectionProvider,
        dropTableNode: createDropTableNode(parseTable(table)),
      })
    },

    dropTableIfExists(table: string): DropTableBuilder {
      return new DropTableBuilder({
        compiler,
        connectionProvider,
        dropTableNode: createDropTableNode(parseTable(table), 'IfExists'),
      })
    },
  })
}
