import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { CreateTypeNode } from '../operation-node/create-type-node.js'

export class CreateTypeBuilder implements OperationNodeSource, Compilable {
  readonly #props: CreateTypeBuilderProps

  constructor(props: CreateTypeBuilderProps) {
    this.#props = freeze(props)
  }

  toOperationNode(): CreateTypeNode {
    return this.#props.executor.transformQuery(
      this.#props.node,
      this.#props.queryId
    )
  }

  /**
   * Creates an anum type.
   *
   * ### Examples
   *
   * ```ts
   * db.schema.createType('species').asEnum(['cat', 'dog', 'frog'])
   * ```
   */
  asEnum(values: string[]): CreateTypeBuilder {
    return new CreateTypeBuilder({
      ...this.#props,
      node: CreateTypeNode.cloneWithEnum(this.#props.node, values),
    })
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
  CreateTypeBuilder,
  "don't await CreateTypeBuilder instances directly. To execute the query you need to call `execute`"
)

export interface CreateTypeBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: CreateTypeNode
}
