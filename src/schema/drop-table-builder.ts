import { DropTableNode } from '../operation-node/drop-table-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'

export class DropTableBuilder implements OperationNodeSource, Compilable {
  readonly #queryId: QueryId
  readonly #dropTableNode: DropTableNode
  readonly #executor: QueryExecutor

  constructor(args: DropTableBuilderConstructorArgs) {
    this.#queryId = args.queryId
    this.#dropTableNode = args.dropTableNode
    this.#executor = args.executor
  }

  ifExists(): DropTableBuilder {
    return new DropTableBuilder({
      queryId: this.#queryId,
      executor: this.#executor,
      dropTableNode: DropTableNode.cloneWithModifier(
        this.#dropTableNode,
        'IfExists'
      ),
    })
  }

  toOperationNode(): DropTableNode {
    return this.#executor.transformQuery(this.#dropTableNode, this.#queryId)
  }

  compile(): CompiledQuery {
    return this.#executor.compileQuery(this.toOperationNode(), this.#queryId)
  }

  async execute(): Promise<void> {
    await this.#executor.executeQuery(this.compile(), this.#queryId)
  }
}

preventAwait(
  DropTableBuilder,
  "don't await DropTableBuilder instances directly. To execute the query you need to call `execute`"
)

export interface DropTableBuilderConstructorArgs {
  queryId: QueryId
  dropTableNode: DropTableNode
  executor: QueryExecutor
}
