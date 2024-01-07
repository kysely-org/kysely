import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { DropTriggerNode } from '../operation-node/drop-trigger-node.js'

export class DropTriggerBuilder implements OperationNodeSource, Compilable {
  readonly #props: DropTriggerBuilderProps

  constructor(props: DropTriggerBuilderProps) {
    this.#props = freeze(props)
  }

  ifExists(): DropTriggerBuilder {
    return new DropTriggerBuilder({
      ...this.#props,
      node: DropTriggerNode.cloneWith(this.#props.node, {
        ifExists: true,
      }),
    })
  }

  cascade(): DropTriggerBuilder {
    return new DropTriggerBuilder({
      ...this.#props,
      node: DropTriggerNode.cloneWith(this.#props.node, {
        cascade: true,
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

  toOperationNode(): DropTriggerNode {
    return this.#props.executor.transformQuery(
      this.#props.node,
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
  DropTriggerBuilder,
  "don't await DropTriggerBuilder instances directly. To execute the query you need to call `execute`"
)

export interface DropTriggerBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: DropTriggerNode
}
