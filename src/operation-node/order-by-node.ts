import { freeze } from '../utils/object-utils'
import { OperationNode } from './operation-node'
import { ReferenceExpressionNode } from './operation-node-utils'

export type OrderByDirection = 'asc' | 'desc'

export interface OrderByNode extends OperationNode {
  readonly kind: 'OrderByNode'
  readonly orderBy: ReferenceExpressionNode
  readonly direction: OrderByDirection
}

export function isOrderByNode(node: OperationNode): node is OrderByNode {
  return node.kind === 'OrderByNode'
}

export function createOrderByNode(
  orderBy: ReferenceExpressionNode,
  direction: OrderByDirection
): OrderByNode {
  return freeze({
    kind: 'OrderByNode',
    orderBy,
    direction,
  })
}
