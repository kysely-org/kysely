import { DropSchemaNode } from '../operation-node/drop-schema-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'

export class DropSchemaBuilder implements OperationNodeSource, Compilable {
  readonly #props: DropSchemaBuilderProps

  constructor(props: DropSchemaBuilderProps) {
    this.#props = freeze(props)
  }

  ifExists(): DropSchemaBuilder {
    return new DropSchemaBuilder({
      ...this.#props,
      dropSchemaNode: DropSchemaNode.cloneWith(this.#props.dropSchemaNode, {
        ifExists: true,
      }),
    })
  }

  cascade(): DropSchemaBuilder {
    return new DropSchemaBuilder({
      ...this.#props,
      dropSchemaNode: DropSchemaNode.cloneWith(this.#props.dropSchemaNode, {
        cascade: true,
      }),
    })
  }

  toOperationNode(): DropSchemaNode {
    return this.#props.executor.transformQuery(
      this.#props.dropSchemaNode,
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
  DropSchemaBuilder,
  "don't await DropSchemaBuilder instances directly. To execute the query you need to call `execute`"
)

export interface DropSchemaBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly dropSchemaNode: DropSchemaNode
}
