import { freeze } from '../util/object-utils'
import { OperationNode } from './operation-node'
import { ReferenceExpressionNode } from './operation-node-utils'

export type OrderByDirection = 'asc' | 'desc'

export interface OrderByItemNode extends OperationNode {
  readonly kind: 'OrderByItemNode'
  readonly orderBy: ReferenceExpressionNode
  readonly direction: OrderByDirection
}

export const orderByItemNode = freeze({
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
