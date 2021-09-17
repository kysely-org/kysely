import { freeze } from '../util/object-utils'
import { OperationNode } from './operation-node'
import { FilterExpressionNode } from './operation-node-utils'

export interface OrNode extends OperationNode {
  readonly kind: 'OrNode'
  readonly left: FilterExpressionNode
  readonly right: FilterExpressionNode
}

/**
 * @internal
 */
export const orNode = freeze({
  is(node: OperationNode): node is OrNode {
    return node.kind === 'OrNode'
  },

  create(left: FilterExpressionNode, right: FilterExpressionNode): OrNode {
    return freeze({
      kind: 'OrNode',
      left,
      right,
    })
  },
})
