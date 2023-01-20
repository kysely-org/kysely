import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { ConstraintNode } from './constraint-node.js'

export interface AddConstraintNode extends OperationNode {
  readonly kind: 'AddConstraintNode'
  readonly constraint: ConstraintNode
  readonly deferred?: boolean
}

/**
 * @internal
 */
export const AddConstraintNode = freeze({
  is(node: OperationNode): node is AddConstraintNode {
    return node.kind === 'AddConstraintNode'
  },

  create(constraint: ConstraintNode, deferred?: boolean): AddConstraintNode {
    return freeze({
      kind: 'AddConstraintNode',
      constraint,
      deferred
    })
  },
})
