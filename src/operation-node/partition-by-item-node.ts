import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { OperationNode } from './operation-node.js'
import { ReferenceNode } from './reference-node.js'

export interface PartitionByItemNode extends OperationNode {
  readonly kind: 'PartitionByItemNode'
  readonly partitionBy: ColumnNode | ReferenceNode
}

/**
 * @internal
 */
export const PartitionByItemNode = freeze({
  is(node: OperationNode): node is PartitionByItemNode {
    return node.kind === 'PartitionByItemNode'
  },

  create(partitionBy: ColumnNode | ReferenceNode): PartitionByItemNode {
    return freeze({
      kind: 'PartitionByItemNode',
      partitionBy,
    })
  },
})
