import {
  createSchemaNode,
  CreateSchemaNode,
} from '../operation-node/create-schema-node'
import { OperationNodeSource } from '../operation-node/operation-node-source'
import { CompiledQuery } from '../query-compiler/compiled-query'
import { Compilable } from '../util/compilable'
import { preventAwait } from '../util/prevent-await'
import { QueryExecutor } from '../util/query-executor'

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
      createSchemaNode: createSchemaNode.cloneWithModifier(
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
