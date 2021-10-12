import { CreateSchemaNode } from '../operation-node/create-schema-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'

export class CreateSchemaBuilder implements OperationNodeSource, Compilable {
  readonly #queryId: QueryId
  readonly #createSchemaNode: CreateSchemaNode
  readonly #executor: QueryExecutor

  constructor(args: CreateSchemaBuilderConstructorArgs) {
    this.#queryId = args.queryId
    this.#createSchemaNode = args.createSchemaNode
    this.#executor = args.executor
  }

  ifNotExists(): CreateSchemaBuilder {
    return new CreateSchemaBuilder({
      queryId: this.#queryId,
      executor: this.#executor,
      createSchemaNode: CreateSchemaNode.cloneWithModifier(
        this.#createSchemaNode,
        'IfNotExists'
      ),
    })
  }

  toOperationNode(): CreateSchemaNode {
    return this.#executor.transformQuery(this.#createSchemaNode, this.#queryId)
  }

  compile(): CompiledQuery {
    return this.#executor.compileQuery(this.toOperationNode(), this.#queryId)
  }

  async execute(): Promise<void> {
    await this.#executor.executeQuery(this.compile(), this.#queryId)
  }
}

preventAwait(
  CreateSchemaBuilder,
  "don't await CreateSchemaBuilder instances directly. To execute the query you need to call `execute`"
)

export interface CreateSchemaBuilderConstructorArgs {
  queryId: QueryId
  createSchemaNode: CreateSchemaNode
  executor: QueryExecutor
}
