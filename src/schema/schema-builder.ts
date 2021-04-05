import { ConnectionProvider } from '../driver/connection-provider'
import { createCreateTableNode } from '../operation-node/create-table-node'
import { createDropTableNode } from '../operation-node/drop-table-node'
import { parseTable } from '../query-builder/methods/from-method'
import { QueryCompiler } from '../query-compiler/query-compiler'
import { CreateTableBuilder } from './create-table-builder'
import { DropTableBuilder } from './drop-table-builder'

export class SchemaBuilder {
  readonly #compiler: QueryCompiler
  readonly #connectionProvider: ConnectionProvider

  constructor(compiler: QueryCompiler, connectionProvider: ConnectionProvider) {
    this.#compiler = compiler
    this.#connectionProvider = connectionProvider
  }

  createTable(table: string): CreateTableBuilder {
    return new CreateTableBuilder({
      compiler: this.#compiler,
      connectionProvider: this.#connectionProvider,
      createTableNode: createCreateTableNode(parseTable(table)),
    })
  }

  dropTable(table: string): DropTableBuilder {
    return new DropTableBuilder({
      compiler: this.#compiler,
      connectionProvider: this.#connectionProvider,
      dropTableNode: createDropTableNode(parseTable(table)),
    })
  }

  dropTableIfExists(table: string): DropTableBuilder {
    return new DropTableBuilder({
      compiler: this.#compiler,
      connectionProvider: this.#connectionProvider,
      dropTableNode: createDropTableNode(parseTable(table), 'IfExists'),
    })
  }
}
