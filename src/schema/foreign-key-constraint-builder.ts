import { ForeignKeyConstraintNode } from '../operation-node/foreign-key-constraint-node.js'
import type { OperationNodeSource } from '../operation-node/operation-node-source.js'
import type { OnModifyForeignAction } from '../operation-node/references-node.js'
import { parseOnModifyForeignAction } from '../parser/on-modify-action-parser.js'

export interface ForeignKeyConstraintBuilderInterface<R> {
  onDelete(onDelete: OnModifyForeignAction): R
  onUpdate(onUpdate: OnModifyForeignAction): R
  deferrable(): R
  notDeferrable(): R
  initiallyDeferred(): R
  initiallyImmediate(): R
}

export class ForeignKeyConstraintBuilder
  implements
    ForeignKeyConstraintBuilderInterface<ForeignKeyConstraintBuilder>,
    OperationNodeSource
{
  readonly #node: ForeignKeyConstraintNode

  constructor(node: ForeignKeyConstraintNode) {
    this.#node = node
  }

  onDelete(onDelete: OnModifyForeignAction): ForeignKeyConstraintBuilder {
    return new ForeignKeyConstraintBuilder(
      ForeignKeyConstraintNode.cloneWith(this.#node, {
        onDelete: parseOnModifyForeignAction(onDelete),
      }),
    )
  }

  onUpdate(onUpdate: OnModifyForeignAction): ForeignKeyConstraintBuilder {
    return new ForeignKeyConstraintBuilder(
      ForeignKeyConstraintNode.cloneWith(this.#node, {
        onUpdate: parseOnModifyForeignAction(onUpdate),
      }),
    )
  }

  deferrable(): ForeignKeyConstraintBuilder {
    return new ForeignKeyConstraintBuilder(
      ForeignKeyConstraintNode.cloneWith(this.#node, { deferrable: true }),
    )
  }

  notDeferrable(): ForeignKeyConstraintBuilder {
    return new ForeignKeyConstraintBuilder(
      ForeignKeyConstraintNode.cloneWith(this.#node, { deferrable: false }),
    )
  }

  initiallyDeferred(): ForeignKeyConstraintBuilder {
    return new ForeignKeyConstraintBuilder(
      ForeignKeyConstraintNode.cloneWith(this.#node, {
        initiallyDeferred: true,
      }),
    )
  }

  initiallyImmediate(): ForeignKeyConstraintBuilder {
    return new ForeignKeyConstraintBuilder(
      ForeignKeyConstraintNode.cloneWith(this.#node, {
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

  toOperationNode(): ForeignKeyConstraintNode {
    return this.#node
  }
}

export type ForeignKeyConstraintBuilderCallback = (
  builder: ForeignKeyConstraintBuilder,
) => ForeignKeyConstraintBuilder
