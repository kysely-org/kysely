import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CheckConstraintNode } from '../operation-node/check-constraint-node.js'

export class CheckConstraintBuilder implements OperationNodeSource {
  readonly #node: CheckConstraintNode

  constructor(node: CheckConstraintNode) {
    this.#node = node
  }

  /**
   * Simply calls the provided function passing `this` as the only argument. `$call` returns
   * what the provided function returns.
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  toOperationNode(): CheckConstraintNode {
    return this.#node
  }
}

export type CheckConstraintBuilderCallback = (
  builder: CheckConstraintBuilder,
) => CheckConstraintBuilder
