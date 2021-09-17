import {
  dropSchemaNode,
  DropSchemaNode,
} from '../operation-node/drop-schema-node'
import { OperationNodeSource } from '../operation-node/operation-node-source'
import { CompiledQuery } from '../query-compiler/compiled-query'
import { Compilable } from '../util/compilable'
import { preventAwait } from '../util/prevent-await'
import { QueryExecutor } from '../query-executor/query-executor'

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
      dropSchemaNode: dropSchemaNode.cloneWithModifier(
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
