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

  createTable(
    table: string,
    build: (tableBuilder: CreateTableBuilder) => CreateTableBuilder
  ): Promise<void> {
    const tableBuilder = build(
      new CreateTableBuilder({
        compiler: this.#compiler,
        connectionProvider: this.#connectionProvider,
        createTableNode: createCreateTableNode(parseTable(table)),
      })
    )

    return tableBuilder.execute()
  }

  dropTable(table: string): Promise<void> {
    const dropBuilder = new DropTableBuilder({
      compiler: this.#compiler,
      connectionProvider: this.#connectionProvider,
      dropTableNode: createDropTableNode(parseTable(table)),
    })

    return dropBuilder.execute()
  }

  dropTableIfExists(table: string): Promise<void> {
    const dropBuilder = new DropTableBuilder({
      compiler: this.#compiler,
      connectionProvider: this.#connectionProvider,
      dropTableNode: createDropTableNode(parseTable(table), 'IfExists'),
    })

    return dropBuilder.execute()
  }
}
