import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'

export interface PartitionByItemNode extends OperationNode {
  readonly kind: 'PartitionByItemNode'
  readonly partitionBy: OperationNode
}

type PartitionByItemNodeFactory = Readonly<{
  is(node: OperationNode): node is PartitionByItemNode
  create(partitionBy: OperationNode): Readonly<PartitionByItemNode>
}>

/**
 * @internal
 */
export const PartitionByItemNode: PartitionByItemNodeFactory =
  freeze<PartitionByItemNodeFactory>({
    is(node): node is PartitionByItemNode {
      return node.kind === 'PartitionByItemNode'
    },

    create(partitionBy) {
      return freeze({
        kind: 'PartitionByItemNode',
        partitionBy,
      })
    },
  })
