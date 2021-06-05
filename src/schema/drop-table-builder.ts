import { ConnectionProvider } from '../driver/connection-provider'
import { DropTableNode } from '../operation-node/drop-table-node'
import { OperationNodeSource } from '../operation-node/operation-node-source'
import { CompiledQuery } from '../query-compiler/compiled-query'
import { QueryCompiler } from '../query-compiler/query-compiler'
import { preventAwait } from '../util/prevent-await'

export class DropTableBuilder implements OperationNodeSource {
  readonly #dropTableNode: DropTableNode
  readonly #compiler?: QueryCompiler
  readonly #connectionProvider?: ConnectionProvider

  constructor({
    dropTableNode,
    compiler,
    connectionProvider,
  }: DropTableBuilderConstructorArgs) {
    this.#dropTableNode = dropTableNode
    this.#compiler = compiler
    this.#connectionProvider = connectionProvider
  }

  toOperationNode(): DropTableNode {
    return this.#dropTableNode
  }

  compile(): CompiledQuery {
    if (!this.#compiler) {
      throw new Error(`this builder cannot be compiled to SQL`)
    }

    return this.#compiler.compile(this.#dropTableNode)
  }

  async execute(): Promise<void> {
    if (!this.#connectionProvider) {
      throw new Error(`this builder cannot be executed`)
    }

    await this.#connectionProvider.withConnection(async (connection) => {
      await connection.executeQuery(this.compile())
    })
  }
}

preventAwait(
  DropTableBuilder,
  "don't await DropTableBuilder instances directly. To execute the query you need to call `execute`"
)

export interface DropTableBuilderConstructorArgs {
  dropTableNode: DropTableNode
  compiler?: QueryCompiler
  connectionProvider?: ConnectionProvider
}
