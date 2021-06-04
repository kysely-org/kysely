import { freeze } from '../util/object-utils'
import { OperationNode } from './operation-node'
import { OrderByItemNode } from './order-by-item-node'

export interface OrderByNode extends OperationNode {
  readonly kind: 'OrderByNode'
  readonly items: ReadonlyArray<OrderByItemNode>
}

export function isOrderByNode(node: OperationNode): node is OrderByNode {
  return node.kind === 'OrderByNode'
}

export function createOrderByNode(item: OrderByItemNode): OrderByNode {
  return freeze({
    kind: 'OrderByNode',
    items: freeze([item]),
  })
}

export function cloneOrderByNodeWithItem(
  orderBy: OrderByNode,
  item: OrderByItemNode
): OrderByNode {
  return freeze({
    ...orderBy,
    items: freeze([...orderBy.items, item]),
  })
}
