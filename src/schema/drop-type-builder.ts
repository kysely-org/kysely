import { DropTypeNode } from '../operation-node/drop-type-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'

export class DropTypeBuilder implements OperationNodeSource, Compilable {
  readonly #props: DropTypeBuilderProps

  constructor(props: DropTypeBuilderProps) {
    this.#props = freeze(props)
  }

  ifExists(): DropTypeBuilder {
    return new DropTypeBuilder({
      ...this.#props,
      node: DropTypeNode.cloneWith(this.#props.node, {
        ifExists: true,
      }),
    })
  }

  /**
   * Simply calls the provided function passing `this` as the only argument. `$call` returns
   * what the provided function returns.
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  toOperationNode(): DropTypeNode {
    return this.#props.executor.transformQuery(
      this.#props.node,
      this.#props.queryId,
    )
  }

  compile(): CompiledQuery {
    return this.#props.executor.compileQuery(
      this.toOperationNode(),
      this.#props.queryId,
    )
  }

  async execute(): Promise<void> {
    await this.#props.executor.executeQuery(this.compile(), this.#props.queryId)
  }
}

preventAwait(
  DropTypeBuilder,
  "don't await DropTypeBuilder instances directly. To execute the query you need to call `execute`",
)

export interface DropTypeBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: DropTypeNode
}
