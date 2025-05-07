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

type OrderByItemNodeFactory = Readonly<{
  is(node: OperationNode): node is OrderByItemNode
  create(
    orderBy: OperationNode,
    direction?: OperationNode,
  ): Readonly<OrderByItemNode>
  cloneWith(
    node: OrderByItemNode,
    props: OrderByItemNodeProps,
  ): Readonly<OrderByItemNode>
}>

/**
 * @internal
 */
export const OrderByItemNode: OrderByItemNodeFactory =
  freeze<OrderByItemNodeFactory>({
    is(node): node is OrderByItemNode {
      return node.kind === 'OrderByItemNode'
    },

    create(orderBy, direction?) {
      return freeze({
        kind: 'OrderByItemNode',
        orderBy,
        direction,
      })
    },

    cloneWith(node, props) {
      return freeze({
        ...node,
        ...props,
      })
    },
  })
