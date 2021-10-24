import { CreateSchemaNode } from '../operation-node/create-schema-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'

export class CreateSchemaBuilder implements OperationNodeSource, Compilable {
  readonly #props: CreateSchemaBuilderProps

  constructor(props: CreateSchemaBuilderProps) {
    this.#props = freeze(props)
  }

  ifNotExists(): CreateSchemaBuilder {
    return new CreateSchemaBuilder({
      ...this.#props,
      createSchemaNode: CreateSchemaNode.cloneWithModifier(
        this.#props.createSchemaNode,
        'IfNotExists'
      ),
    })
  }

  toOperationNode(): CreateSchemaNode {
    return this.#props.executor.transformQuery(
      this.#props.createSchemaNode,
      this.#props.queryId
    )
  }

  compile(): CompiledQuery {
    return this.#props.executor.compileQuery(
      this.toOperationNode(),
      this.#props.queryId
    )
  }

  async execute(): Promise<void> {
    await this.#props.executor.executeQuery(this.compile(), this.#props.queryId)
  }
}

preventAwait(
  CreateSchemaBuilder,
  "don't await CreateSchemaBuilder instances directly. To execute the query you need to call `execute`"
)

export interface CreateSchemaBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly createSchemaNode: CreateSchemaNode
}
