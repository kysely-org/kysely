import { DropTypeNode } from '../operation-node/drop-type-node.js'
import type { OperationNodeSource } from '../operation-node/operation-node-source.js'
import type { CompiledQuery } from '../query-compiler/compiled-query.js'
import type { Compilable } from '../util/compilable.js'
import type { QueryExecutor } from '../query-executor/query-executor.js'
import type { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'

export class DropTypeBuilder implements OperationNodeSource, Compilable {
  readonly #props: DropTypeBuilderProps

  constructor(props: DropTypeBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Adds `if exists` to the query.
   */
  ifExists(): DropTypeBuilder {
    return new DropTypeBuilder({
      ...this.#props,
      node: DropTypeNode.cloneWith(this.#props.node, {
        ifExists: true,
      }),
    })
  }

  /**
   * Adds `cascade` to the query.
   */
  cascade(): DropTypeBuilder {
    return new DropTypeBuilder({
      ...this.#props,
      node: DropTypeNode.cloneWith(this.#props.node, {
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
    await this.#props.executor.executeQuery(this.compile())
  }
}

export interface DropTypeBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: DropTypeNode
}
