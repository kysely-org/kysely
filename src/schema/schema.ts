import { ConnectionProvider } from '../driver/connection-provider'
import { createCreateTableNode } from '../operation-node/create-table-node'
import { createDropTableNode } from '../operation-node/drop-table-node'
import { parseTable } from '../parser/table-parser'
import { QueryCompiler } from '../query-compiler/query-compiler'
import { freeze } from '../utils/object-utils'
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
   * ```ts
   * await db.schema.
   * ```
   */
  createTable(table: string): CreateTableBuilder
  dropTable(table: string): DropTableBuilder
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
