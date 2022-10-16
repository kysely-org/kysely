import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface OrderByItemNode extends OperationNode {
  readonly kind: 'OrderByItemNode'
  readonly orderBy: OperationNode
  // TODO(samiko): Do we need an OrderByDirectionNode for consistency?
  readonly direction?: OperationNode
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
})
