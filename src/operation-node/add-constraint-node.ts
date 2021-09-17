import { OperationNode } from './operation-node'
import { freeze } from '../util/object-utils'
import { ConstraintNode } from './constraint-node'

export interface AddConstraintNode extends OperationNode {
  readonly kind: 'AddConstraintNode'
  readonly constraint: ConstraintNode
}

/**
 * @internal
 */
export const addConstraintNode = freeze({
  is(node: OperationNode): node is AddConstraintNode {
    return node.kind === 'AddConstraintNode'
  },

  create(constraint: ConstraintNode): AddConstraintNode {
    return freeze({
      kind: 'AddConstraintNode',
      constraint,
    })
  },
})
