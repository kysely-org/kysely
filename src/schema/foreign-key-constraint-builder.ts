import { ForeignKeyConstraintNode } from '../operation-node/foreign-key-constraint-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { OnModifyForeignAction } from '../operation-node/references-node.js'
import { freeze } from '../util/object-utils.js'
import { preventAwait } from '../util/prevent-await.js'

export class ForeignKeyConstraintBuilder implements OperationNodeSource {
  readonly #props: ForeignKeyConstraintBuilderProps

  constructor(props: ForeignKeyConstraintBuilderProps) {
    this.#props = freeze(props)
  }

  onDelete(onDelete: OnModifyForeignAction): ForeignKeyConstraintBuilder {
    return new ForeignKeyConstraintBuilder({
      constraintNode: ForeignKeyConstraintNode.cloneWith(
        this.#props.constraintNode,
        { onDelete }
      ),
    })
  }

  onUpdate(onUpdate: OnModifyForeignAction): ForeignKeyConstraintBuilder {
    return new ForeignKeyConstraintBuilder({
      constraintNode: ForeignKeyConstraintNode.cloneWith(
        this.#props.constraintNode,
        { onUpdate }
      ),
    })
  }

  toOperationNode(): ForeignKeyConstraintNode {
    return this.#props.constraintNode
  }
}

preventAwait(
  ForeignKeyConstraintBuilder,
  "don't await ForeignKeyConstraintBuilder instances directly."
)

export interface ForeignKeyConstraintBuilderProps {
  readonly constraintNode: ForeignKeyConstraintNode
}
