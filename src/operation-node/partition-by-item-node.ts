import { freeze } from '../util/object-utils.js'
import { SimpleReferenceExpressionNode } from './operation-node-utils.js'
import { OperationNode } from './operation-node.js'

export interface PartitionByItemNode extends OperationNode {
  readonly kind: 'PartitionByItemNode'
  readonly partitionBy: SimpleReferenceExpressionNode
}

/**
 * @internal
 */
export const PartitionByItemNode = freeze({
  is(node: OperationNode): node is PartitionByItemNode {
    return node.kind === 'PartitionByItemNode'
  },

  create(partitionBy: SimpleReferenceExpressionNode): PartitionByItemNode {
    return freeze({
      kind: 'PartitionByItemNode',
      partitionBy,
    })
  },
})
