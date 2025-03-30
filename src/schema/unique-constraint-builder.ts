import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { UniqueConstraintNode } from '../operation-node/unique-constraint-node.js'

export class UniqueConstraintNodeBuilder implements OperationNodeSource {
  readonly #node: UniqueConstraintNode

  constructor(node: UniqueConstraintNode) {
    this.#node = node
  }

  /**
   * Adds `nulls not distinct` to the unique constraint definition
   *
   * Supported by PostgreSQL dialect only
   */
  nullsNotDistinct(): UniqueConstraintNodeBuilder {
    return new UniqueConstraintNodeBuilder(
      UniqueConstraintNode.cloneWith(this.#node, { nullsNotDistinct: true }),
    )
  }

  deferrable() {
    return new UniqueConstraintNodeBuilder(
      UniqueConstraintNode.cloneWith(this.#node, { deferrable: true }),
    )
  }

  notDeferrable() {
    return new UniqueConstraintNodeBuilder(
      UniqueConstraintNode.cloneWith(this.#node, { deferrable: false }),
    )
  }

  initiallyDeferred() {
    return new UniqueConstraintNodeBuilder(
      UniqueConstraintNode.cloneWith(this.#node, {
        initiallyDeferred: true,
      }),
    )
  }

  initiallyImmediate() {
    return new UniqueConstraintNodeBuilder(
      UniqueConstraintNode.cloneWith(this.#node, {
        initiallyDeferred: false,
      }),
    )
  }

  /**
   * Simply calls the provided function passing `this` as the only argument. `$call` returns
   * what the provided function returns.
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  toOperationNode(): UniqueConstraintNode {
    return this.#node
  }
}

export type UniqueConstraintNodeBuilderCallback = (
  builder: UniqueConstraintNodeBuilder,
) => UniqueConstraintNodeBuilder
