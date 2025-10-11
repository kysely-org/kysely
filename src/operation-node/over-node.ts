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

type OverNodeFactory = Readonly<{
  is(node: OperationNode): node is OverNode
  create(): Readonly<OverNode>
  cloneWithOrderByItems(
    overNode: OverNode,
    items: ReadonlyArray<OrderByItemNode>,
  ): Readonly<OverNode>
  cloneWithPartitionByItems(
    overNode: OverNode,
    items: ReadonlyArray<PartitionByItemNode>,
  ): Readonly<OverNode>
}>

/**
 * @internal
 */
export const OverNode: OverNodeFactory = freeze<OverNodeFactory>({
  is(node): node is OverNode {
    return node.kind === 'OverNode'
  },

  create() {
    return freeze({
      kind: 'OverNode',
    })
  },

  cloneWithOrderByItems(overNode, items) {
    return freeze({
      ...overNode,
      orderBy: overNode.orderBy
        ? OrderByNode.cloneWithItems(overNode.orderBy, items)
        : OrderByNode.create(items),
    })
  },

  cloneWithPartitionByItems(overNode, items) {
    return freeze({
      ...overNode,
      partitionBy: overNode.partitionBy
        ? PartitionByNode.cloneWithItems(overNode.partitionBy, items)
        : PartitionByNode.create(items),
    })
  },
})
