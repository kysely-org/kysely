import { freeze } from '../utils/object-utils'
import { OperationNode } from './operation-node'
import { ReferenceExpressionNode } from './operation-node-utils'

export type OrderByDirection = 'asc' | 'desc'

export interface OrderByItemNode extends OperationNode {
  readonly kind: 'OrderByItemNode'
  readonly orderBy: ReferenceExpressionNode
  readonly direction: OrderByDirection
}

export function isOrderByItemNode(
  node: OperationNode
): node is OrderByItemNode {
  return node.kind === 'OrderByItemNode'
}

export function createOrderByItemNode(
  orderBy: ReferenceExpressionNode,
  direction: OrderByDirection
): OrderByItemNode {
  return freeze({
    kind: 'OrderByItemNode',
    orderBy,
    direction,
  })
}
