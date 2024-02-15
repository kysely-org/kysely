import { freeze } from '../util/object-utils.js'
import { PartitionByItemNode } from './partition-by-item-node.js'
import { OperationNode } from './operation-node.js'

export interface PartitionByNode extends OperationNode {
  readonly kind: 'PartitionByNode'
  readonly items: ReadonlyArray<PartitionByItemNode>
}

/**
 * @internal
 */
export const PartitionByNode = freeze({
  is(node: OperationNode): node is PartitionByNode {
    return node.kind === 'PartitionByNode'
  },

  create(items: ReadonlyArray<PartitionByItemNode>): PartitionByNode {
    return freeze({
      kind: 'PartitionByNode',
      items: freeze(items),
    })
  },

  cloneWithItems(
    partitionBy: PartitionByNode,
    items: ReadonlyArray<PartitionByItemNode>,
  ): PartitionByNode {
    return freeze({
      ...partitionBy,
      items: freeze([...partitionBy.items, ...items]),
    })
  },
})
