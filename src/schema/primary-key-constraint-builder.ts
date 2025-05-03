import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { PrimaryKeyConstraintNode } from '../operation-node/primary-key-constraint-node.js'

export class PrimaryKeyConstraintBuilder implements OperationNodeSource {
  readonly #node: PrimaryKeyConstraintNode

  constructor(node: PrimaryKeyConstraintNode) {
    this.#node = node
  }

  deferrable(): PrimaryKeyConstraintBuilder {
    return new PrimaryKeyConstraintBuilder(
      PrimaryKeyConstraintNode.cloneWith(this.#node, { deferrable: true }),
    )
  }

  notDeferrable(): PrimaryKeyConstraintBuilder {
    return new PrimaryKeyConstraintBuilder(
      PrimaryKeyConstraintNode.cloneWith(this.#node, { deferrable: false }),
    )
  }

  initiallyDeferred(): PrimaryKeyConstraintBuilder {
    return new PrimaryKeyConstraintBuilder(
      PrimaryKeyConstraintNode.cloneWith(this.#node, {
        initiallyDeferred: true,
      }),
    )
  }

  initiallyImmediate(): PrimaryKeyConstraintBuilder {
    return new PrimaryKeyConstraintBuilder(
      PrimaryKeyConstraintNode.cloneWith(this.#node, {
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

  toOperationNode(): PrimaryKeyConstraintNode {
    return this.#node
  }
}

export type PrimaryKeyConstraintBuilderCallback = (
  builder: PrimaryKeyConstraintBuilder,
) => PrimaryKeyConstraintBuilder
