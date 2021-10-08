import { CreateSchemaNode } from '../operation-node/create-schema-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'

export class CreateSchemaBuilder implements OperationNodeSource, Compilable {
  readonly #createSchemaNode: CreateSchemaNode
  readonly #executor: QueryExecutor

  constructor(args: CreateSchemaBuilderConstructorArgs) {
    this.#createSchemaNode = args.createSchemaNode
    this.#executor = args.executor
  }

  ifNotExists(): CreateSchemaBuilder {
    return new CreateSchemaBuilder({
      executor: this.#executor,
      createSchemaNode: CreateSchemaNode.cloneWithModifier(
        this.#createSchemaNode,
        'IfNotExists'
      ),
    })
  }

  toOperationNode(): CreateSchemaNode {
    return this.#executor.transformNode(this.#createSchemaNode)
  }

  compile(): CompiledQuery {
    return this.#executor.compileQuery(this.toOperationNode())
  }

  async execute(): Promise<void> {
    await this.#executor.executeQuery(this.compile())
  }
}

preventAwait(
  CreateSchemaBuilder,
  "don't await CreateSchemaBuilder instances directly. To execute the query you need to call `execute`"
)

export interface CreateSchemaBuilderConstructorArgs {
  createSchemaNode: CreateSchemaNode
  executor: QueryExecutor
}
