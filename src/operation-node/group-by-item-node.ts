import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface GroupByItemNode extends OperationNode {
  readonly kind: 'GroupByItemNode'
  readonly groupBy: OperationNode
}

/**
 * @internal
 */
export const GroupByItemNode = freeze({
  is(node: OperationNode): node is GroupByItemNode {
    return node.kind === 'GroupByItemNode'
  },

  create(groupBy: OperationNode): GroupByItemNode {
    return freeze({
      kind: 'GroupByItemNode',
      groupBy,
    })
  },
})
