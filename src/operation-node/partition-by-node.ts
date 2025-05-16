import { freeze } from '../util/object-utils.js'
import { PartitionByItemNode } from './partition-by-item-node.js'
import { OperationNode } from './operation-node.js'

export interface PartitionByNode extends OperationNode {
  readonly kind: 'PartitionByNode'
  readonly items: ReadonlyArray<PartitionByItemNode>
}

type PartitionByNodeFactory = Readonly<{
  is(node: OperationNode): node is PartitionByNode
  create(items: ReadonlyArray<PartitionByItemNode>): Readonly<PartitionByNode>
  cloneWithItems(
    partitionBy: PartitionByNode,
    items: ReadonlyArray<PartitionByItemNode>,
  ): Readonly<PartitionByNode>
}>

/**
 * @internal
 */
export const PartitionByNode: PartitionByNodeFactory =
  freeze<PartitionByNodeFactory>({
    is(node): node is PartitionByNode {
      return node.kind === 'PartitionByNode'
    },

    create(items) {
      return freeze({
        kind: 'PartitionByNode',
        items: freeze(items),
      })
    },

    cloneWithItems(partitionBy, items) {
      return freeze({
        ...partitionBy,
        items: freeze([...partitionBy.items, ...items]),
      })
    },
  })
