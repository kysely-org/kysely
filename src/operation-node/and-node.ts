import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { FilterExpressionNode } from './operation-node-utils.js'

export interface AndNode extends OperationNode {
  readonly kind: 'AndNode'
  readonly left: FilterExpressionNode
  readonly right: FilterExpressionNode
}

/**
 * @internal
 */
export const AndNode = freeze({
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
