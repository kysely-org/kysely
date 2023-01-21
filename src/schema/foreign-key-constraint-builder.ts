import { ForeignKeyConstraintNode } from '../operation-node/foreign-key-constraint-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { OnModifyForeignAction } from '../operation-node/references-node.js'
import { parseOnModifyForeignAction } from '../parser/on-modify-action-parser.js'
import { preventAwait } from '../util/prevent-await.js'

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
      })
    )
  }

  onUpdate(onUpdate: OnModifyForeignAction): ForeignKeyConstraintBuilder {
    return new ForeignKeyConstraintBuilder(
      ForeignKeyConstraintNode.cloneWith(this.#node, {
        onUpdate: parseOnModifyForeignAction(onUpdate),
      })
    )
  }

  deferrable(): ForeignKeyConstraintBuilder {
    return new ForeignKeyConstraintBuilder(
      ForeignKeyConstraintNode.cloneWith(this.#node, {
        deferrableModifier: 'deferrable',
      })
    )
  }

  notDeferrable(): ForeignKeyConstraintBuilder {
    return new ForeignKeyConstraintBuilder(
      ForeignKeyConstraintNode.cloneWith(this.#node, {
        deferrableModifier: 'not deferrable',
      })
    )
  }

  initiallyImmediate(): ForeignKeyConstraintBuilder {
    return new ForeignKeyConstraintBuilder(
      ForeignKeyConstraintNode.cloneWith(this.#node, {
        initiallyModifier: 'initially immediate',
      })
    )
  }

  initiallyDeferred(): ForeignKeyConstraintBuilder {
    return new ForeignKeyConstraintBuilder(
      ForeignKeyConstraintNode.cloneWith(this.#node, {
        initiallyModifier: 'initially deferred',
      })
    )
  }

  toOperationNode(): ForeignKeyConstraintNode {
    return this.#node
  }
}

preventAwait(
  ForeignKeyConstraintBuilder,
  "don't await ForeignKeyConstraintBuilder instances directly."
)
