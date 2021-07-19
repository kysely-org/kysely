import { ConnectionProvider } from '../driver/connection-provider'
import { DropIndexNode } from '../operation-node/drop-index-node'
import { OperationNodeSource } from '../operation-node/operation-node-source'
import { CompiledQuery } from '../query-compiler/compiled-query'
import { QueryCompiler } from '../query-compiler/query-compiler'
import { Compilable } from '../util/compilable'
import { preventAwait } from '../util/prevent-await'

export class DropIndexBuilder implements OperationNodeSource, Compilable {
  readonly #dropIndexNode: DropIndexNode
  readonly #compiler?: QueryCompiler
  readonly #connectionProvider?: ConnectionProvider

  constructor({
    dropIndexNode,
    compiler,
    connectionProvider,
  }: DropIndexBuilderConstructorArgs) {
    this.#dropIndexNode = dropIndexNode
    this.#compiler = compiler
    this.#connectionProvider = connectionProvider
  }

  toOperationNode(): DropIndexNode {
    return this.#dropIndexNode
  }

  compile(): CompiledQuery {
    if (!this.#compiler) {
      throw new Error(`this builder cannot be compiled to SQL`)
    }

    return this.#compiler.compileQuery(this.#dropIndexNode)
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
  DropIndexBuilder,
  "don't await DropIndexBuilder instances directly. To execute the query you need to call `execute`"
)

export interface DropIndexBuilderConstructorArgs {
  dropIndexNode: DropIndexNode
  compiler?: QueryCompiler
  connectionProvider?: ConnectionProvider
}
