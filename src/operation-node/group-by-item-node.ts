import { freeze } from '../util/object-utils'
import { OperationNode } from './operation-node'
import { ReferenceExpressionNode } from './operation-node-utils'

export interface GroupByItemNode extends OperationNode {
  readonly kind: 'GroupByItemNode'
  readonly groupBy: ReferenceExpressionNode
}

/**
 * @internal
 */
export const groupByItemNode = freeze({
  is(node: OperationNode): node is GroupByItemNode {
    return node.kind === 'GroupByItemNode'
  },

  create(groupBy: ReferenceExpressionNode): GroupByItemNode {
    return freeze({
      kind: 'GroupByItemNode',
      groupBy,
    })
  },
})
