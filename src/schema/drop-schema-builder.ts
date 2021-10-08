import { DropSchemaNode } from '../operation-node/drop-schema-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'

export class DropSchemaBuilder implements OperationNodeSource, Compilable {
  readonly #dropSchemaNode: DropSchemaNode
  readonly #executor: QueryExecutor

  constructor(args: DropSchemaBuilderConstructorArgs) {
    this.#dropSchemaNode = args.dropSchemaNode
    this.#executor = args.executor
  }

  ifExists(): DropSchemaBuilder {
    return new DropSchemaBuilder({
      executor: this.#executor,
      dropSchemaNode: DropSchemaNode.cloneWithModifier(
        this.#dropSchemaNode,
        'IfExists'
      ),
    })
  }

  toOperationNode(): DropSchemaNode {
    return this.#executor.transformNode(this.#dropSchemaNode)
  }

  compile(): CompiledQuery {
    return this.#executor.compileQuery(this.toOperationNode())
  }

  async execute(): Promise<void> {
    await this.#executor.executeQuery(this.compile())
  }
}

preventAwait(
  DropSchemaBuilder,
  "don't await DropSchemaBuilder instances directly. To execute the query you need to call `execute`"
)

export interface DropSchemaBuilderConstructorArgs {
  dropSchemaNode: DropSchemaNode
  executor: QueryExecutor
}
