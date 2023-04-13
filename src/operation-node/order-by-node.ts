import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { OrderByItemNode } from './order-by-item-node.js'

export interface OrderByNode extends OperationNode {
  readonly kind: 'OrderByNode'
  readonly items: ReadonlyArray<OrderByItemNode>
}

/**
 * @internal
 */
export const OrderByNode = freeze({
  is(node: OperationNode): node is OrderByNode {
    return node.kind === 'OrderByNode'
  },

  create(items: ReadonlyArray<OrderByItemNode>): OrderByNode {
    return freeze({
      kind: 'OrderByNode',
      items: freeze([...items]),
    })
  },

  cloneWithItems(
    orderBy: OrderByNode,
    items: ReadonlyArray<OrderByItemNode>
  ): OrderByNode {
    return freeze({
      ...orderBy,
      items: freeze([...orderBy.items, ...items]),
    })
  },
})
