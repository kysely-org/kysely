import { dropIndexNode, DropIndexNode } from '../operation-node/drop-index-node'
import { OperationNodeSource } from '../operation-node/operation-node-source'
import { CompiledQuery } from '../query-compiler/compiled-query'
import { Compilable } from '../util/compilable'
import { preventAwait } from '../util/prevent-await'
import { QueryExecutor } from '../util/query-executor'

export class DropIndexBuilder implements OperationNodeSource, Compilable {
  readonly #dropIndexNode: DropIndexNode
  readonly #executor: QueryExecutor

  constructor(args: DropIndexBuilderConstructorArgs) {
    this.#dropIndexNode = args.dropIndexNode
    this.#executor = args.executor
  }

  ifExists(): DropIndexBuilder {
    return new DropIndexBuilder({
      executor: this.#executor,
      dropIndexNode: dropIndexNode.cloneWithModifier(
        this.#dropIndexNode,
        'IfExists'
      ),
    })
  }

  toOperationNode(): DropIndexNode {
    return this.#executor.transformNode(this.#dropIndexNode)
  }

  compile(): CompiledQuery {
    return this.#executor.compileQuery(this.toOperationNode())
  }

  async execute(): Promise<void> {
    await this.#executor.executeQuery(this.compile())
  }
}

preventAwait(
  DropIndexBuilder,
  "don't await DropIndexBuilder instances directly. To execute the query you need to call `execute`"
)

export interface DropIndexBuilderConstructorArgs {
  dropIndexNode: DropIndexNode
  executor: QueryExecutor
}
