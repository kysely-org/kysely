import { ConnectionProvider } from '../driver/connection-provider'
import { createColumnDefinitionNode } from '../operation-node/column-definition-node'
import {
  cloneCreateTableNodeWithColumn,
  CreateTableNode,
} from '../operation-node/create-table-node'
import { OperationNodeSource } from '../operation-node/operation-node-source'
import { CompiledQuery } from '../query-compiler/compiled-query'
import { QueryCompiler } from '../query-compiler/query-compiler'
import { ColumnBuilder } from './column-builder'

export class CreateTableBuilder implements OperationNodeSource {
  readonly #createTableNode: CreateTableNode
  readonly #compiler?: QueryCompiler
  readonly #connectionProvider?: ConnectionProvider

  constructor({
    createTableNode,
    compiler,
    connectionProvider,
  }: CreateTableBuilderArgs) {
    this.#createTableNode = createTableNode
    this.#compiler = compiler
    this.#connectionProvider = connectionProvider
  }

  /**
   * Adds a column to the table.
   *
   * @example
   * ```ts
   * table.column('id', (col) => col.increments().primary())
   * ```
   */
  column(
    columnName: string,
    build: (tableBuilder: ColumnBuilder) => ColumnBuilder
  ): CreateTableBuilder {
    const columnBuilder = build(
      new ColumnBuilder(createColumnDefinitionNode(columnName))
    )

    return new CreateTableBuilder({
      compiler: this.#compiler,
      connectionProvider: this.#connectionProvider,
      createTableNode: cloneCreateTableNodeWithColumn(
        this.#createTableNode,
        columnBuilder.toOperationNode()
      ),
    })
  }

  toOperationNode(): CreateTableNode {
    return this.#createTableNode
  }

  compile(): CompiledQuery {
    if (!this.#compiler) {
      throw new Error(`this builder cannot be compiled to SQL`)
    }

    return this.#compiler.compile(this.#createTableNode)
  }

  async execute(): Promise<void> {
    if (!this.#connectionProvider) {
      throw new Error(`this builder cannot be executed`)
    }

    await this.#connectionProvider.withConnection(async (connection) => {
      await connection.execute(this.compile())
    })
  }
}

export interface CreateTableBuilderArgs {
  createTableNode: CreateTableNode
  compiler?: QueryCompiler
  connectionProvider?: ConnectionProvider
}
