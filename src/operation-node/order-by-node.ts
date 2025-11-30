import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'
import type { OrderByItemNode } from './order-by-item-node.js'

export interface OrderByNode extends OperationNode {
  readonly kind: 'OrderByNode'
  readonly items: ReadonlyArray<OrderByItemNode>
}

type OrderByNodeFactory = Readonly<{
  is(node: OperationNode): node is OrderByNode
  create(items: ReadonlyArray<OrderByItemNode>): Readonly<OrderByNode>
  cloneWithItems(
    orderBy: OrderByNode,
    items: ReadonlyArray<OrderByItemNode>,
  ): Readonly<OrderByNode>
}>

/**
 * @internal
 */
export const OrderByNode: OrderByNodeFactory = freeze<OrderByNodeFactory>({
  is(node): node is OrderByNode {
    return node.kind === 'OrderByNode'
  },

  create(items) {
    return freeze({
      kind: 'OrderByNode',
      items: freeze([...items]),
    })
  },

  cloneWithItems(orderBy, items) {
    return freeze({
      ...orderBy,
      items: freeze([...orderBy.items, ...items]),
    })
  },
})
