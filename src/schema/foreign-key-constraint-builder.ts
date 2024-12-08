import { ForeignKeyConstraintNode } from '../operation-node/foreign-key-constraint-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { OnModifyForeignAction } from '../operation-node/references-node.js'
import { parseOnModifyForeignAction } from '../parser/on-modify-action-parser.js'

export interface ForeignKeyConstraintBuilderInterface<R> {
  onDelete(onDelete: OnModifyForeignAction): R
  onUpdate(onUpdate: OnModifyForeignAction): R
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
