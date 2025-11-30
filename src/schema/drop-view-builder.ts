import type { OperationNodeSource } from '../operation-node/operation-node-source.js'
import type { CompiledQuery } from '../query-compiler/compiled-query.js'
import type { Compilable } from '../util/compilable.js'
import type { QueryExecutor } from '../query-executor/query-executor.js'
import type { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { DropViewNode } from '../operation-node/drop-view-node.js'

export class DropViewBuilder implements OperationNodeSource, Compilable {
  readonly #props: DropViewBuilderProps

  constructor(props: DropViewBuilderProps) {
    this.#props = freeze(props)
  }

  materialized(): DropViewBuilder {
    return new DropViewBuilder({
      ...this.#props,
      node: DropViewNode.cloneWith(this.#props.node, {
        materialized: true,
      }),
    })
  }

  ifExists(): DropViewBuilder {
    return new DropViewBuilder({
      ...this.#props,
      node: DropViewNode.cloneWith(this.#props.node, {
        ifExists: true,
      }),
    })
  }

  cascade(): DropViewBuilder {
    return new DropViewBuilder({
      ...this.#props,
      node: DropViewNode.cloneWith(this.#props.node, {
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

  toOperationNode(): DropViewNode {
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
    await this.#props.executor.executeQuery(this.compile())
  }
}

export interface DropViewBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: DropViewNode
}
