import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { ReferenceExpressionNode } from './operation-node-utils.js'

export type OrderByDirection = 'asc' | 'desc'

export interface OrderByItemNode extends OperationNode {
  readonly kind: 'OrderByItemNode'
  readonly orderBy: ReferenceExpressionNode
  readonly direction: OrderByDirection
}

/**
 * @internal
 */
export const OrderByItemNode = freeze({
  is(node: OperationNode): node is OrderByItemNode {
    return node.kind === 'OrderByItemNode'
  },

  create(
    orderBy: ReferenceExpressionNode,
    direction: OrderByDirection
  ): OrderByItemNode {
    return freeze({
      kind: 'OrderByItemNode',
      orderBy,
      direction,
    })
  },
})
