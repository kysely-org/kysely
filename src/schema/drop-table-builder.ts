import { DropTableNode } from '../operation-node/drop-table-node.js'
import type { OperationNodeSource } from '../operation-node/operation-node-source.js'
import type { CompiledQuery } from '../query-compiler/compiled-query.js'
import type { Compilable } from '../util/compilable.js'
import type { QueryExecutor } from '../query-executor/query-executor.js'
import type { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'

export class DropTableBuilder implements OperationNodeSource, Compilable {
  readonly #props: DropTableBuilderProps

  constructor(props: DropTableBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Adds the "temporary" modifier.
   *
   * This is only supported by some dialects like MySQL.
   */
  temporary(): DropTableBuilder {
    return new DropTableBuilder({
      ...this.#props,
      node: DropTableNode.cloneWith(this.#props.node, {
        temporary: true,
      }),
    })
  }

  ifExists(): DropTableBuilder {
    return new DropTableBuilder({
      ...this.#props,
      node: DropTableNode.cloneWith(this.#props.node, {
        ifExists: true,
      }),
    })
  }

  cascade(): DropTableBuilder {
    return new DropTableBuilder({
      ...this.#props,
      node: DropTableNode.cloneWith(this.#props.node, {
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

  toOperationNode(): DropTableNode {
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

export interface DropTableBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: DropTableNode
}
