import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { ConstraintNode } from './constraint-node.js'

export interface AddConstraintNode extends OperationNode {
  readonly kind: 'AddConstraintNode'
  readonly constraint: ConstraintNode
}

type AddConstraintNodeFactory = Readonly<{
  is(node: OperationNode): node is AddConstraintNode
  create(constraint: ConstraintNode): Readonly<AddConstraintNode>
}>

/**
 * @internal
 */
export const AddConstraintNode: AddConstraintNodeFactory =
  freeze<AddConstraintNodeFactory>({
    is(node): node is AddConstraintNode {
      return node.kind === 'AddConstraintNode'
    },

    create(constraint) {
      return freeze({
        kind: 'AddConstraintNode',
        constraint,
      })
    },
  })
