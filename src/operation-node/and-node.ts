import { OperationNode } from './operation-node'
import { freeze } from '../util/object-utils'
import { FilterExpressionNode } from './operation-node-utils'

export interface AndNode extends OperationNode {
  readonly kind: 'AndNode'
  readonly left: FilterExpressionNode
  readonly right: FilterExpressionNode
}

/**
 * @internal
 */
export const andNode = freeze({
  is(node: OperationNode): node is AndNode {
    return node.kind === 'AndNode'
  },

  create(left: FilterExpressionNode, right: FilterExpressionNode): AndNode {
    return freeze({
      kind: 'AndNode',
      left,
      right,
    })
  },
})
