import { freeze } from '../util/object-utils.js'
import { CollateNode } from './collate-node.js'
import { OperationNode } from './operation-node.js'

export type OrderByItemNodeProps = Omit<OrderByItemNode, 'kind' | 'orderBy'>

export interface OrderByItemNode extends OperationNode {
  readonly kind: 'OrderByItemNode'
  readonly orderBy: OperationNode
  readonly direction?: OperationNode
  readonly nulls?: 'first' | 'last'
  readonly collation?: CollateNode
}

/**
 * @internal
 */
export const OrderByItemNode = freeze({
  is(node: OperationNode): node is OrderByItemNode {
    return node.kind === 'OrderByItemNode'
  },

  create(orderBy: OperationNode, direction?: OperationNode): OrderByItemNode {
    return freeze({
      kind: 'OrderByItemNode',
      orderBy,
      direction,
    })
  },

  cloneWith(
    node: OrderByItemNode,
    props: OrderByItemNodeProps,
  ): OrderByItemNode {
    return freeze({
      ...node,
      ...props,
    })
  },
})
