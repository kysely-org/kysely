import { DropSchemaNode } from '../operation-node/drop-schema-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'

export class DropSchemaBuilder implements OperationNodeSource, Compilable {
  readonly #queryId: QueryId
  readonly #dropSchemaNode: DropSchemaNode
  readonly #executor: QueryExecutor

  constructor(args: DropSchemaBuilderConstructorArgs) {
    this.#queryId = args.queryId
    this.#dropSchemaNode = args.dropSchemaNode
    this.#executor = args.executor
  }

  ifExists(): DropSchemaBuilder {
    return new DropSchemaBuilder({
      queryId: this.#queryId,
      executor: this.#executor,
      dropSchemaNode: DropSchemaNode.cloneWithModifier(
        this.#dropSchemaNode,
        'IfExists'
      ),
    })
  }

  toOperationNode(): DropSchemaNode {
    return this.#executor.transformQuery(this.#dropSchemaNode, this.#queryId)
  }

  compile(): CompiledQuery {
    return this.#executor.compileQuery(this.toOperationNode(), this.#queryId)
  }

  async execute(): Promise<void> {
    await this.#executor.executeQuery(this.compile(), this.#queryId)
  }
}

preventAwait(
  DropSchemaBuilder,
  "don't await DropSchemaBuilder instances directly. To execute the query you need to call `execute`"
)

export interface DropSchemaBuilderConstructorArgs {
  queryId: QueryId
  dropSchemaNode: DropSchemaNode
  executor: QueryExecutor
}
