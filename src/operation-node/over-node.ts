import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { OrderByItemNode } from './order-by-item-node.js'
import { OrderByNode } from './order-by-node.js'
import { PartitionByItemNode } from './partition-by-item-node.js'
import { PartitionByNode } from './partition-by-node.js'

export interface OverNode extends OperationNode {
  readonly kind: 'OverNode'
  readonly orderBy?: OrderByNode
  readonly partitionBy?: PartitionByNode
}

/**
 * @internal
 */
export const OverNode = freeze({
  is(node: OperationNode): node is OverNode {
    return node.kind === 'OverNode'
  },

  create(): OverNode {
    return freeze({
      kind: 'OverNode',
    })
  },

  cloneWithOrderByItems(
    overNode: OverNode,
    items: ReadonlyArray<OrderByItemNode>,
  ): OverNode {
    return freeze({
      ...overNode,
      orderBy: overNode.orderBy
        ? OrderByNode.cloneWithItems(overNode.orderBy, items)
        : OrderByNode.create(items),
    })
  },

  cloneWithPartitionByItems(
    overNode: OverNode,
    items: ReadonlyArray<PartitionByItemNode>,
  ): OverNode {
    return freeze({
      ...overNode,
      partitionBy: overNode.partitionBy
        ? PartitionByNode.cloneWithItems(overNode.partitionBy, items)
        : PartitionByNode.create(items),
    })
  },
})
