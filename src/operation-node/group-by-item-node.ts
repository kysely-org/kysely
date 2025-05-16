import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface GroupByItemNode extends OperationNode {
  readonly kind: 'GroupByItemNode'
  readonly groupBy: OperationNode
}

type GroupByItemNodeFactory = Readonly<{
  is(node: OperationNode): node is GroupByItemNode
  create(groupBy: OperationNode): Readonly<GroupByItemNode>
}>

/**
 * @internal
 */
export const GroupByItemNode: GroupByItemNodeFactory =
  freeze<GroupByItemNodeFactory>({
    is(node): node is GroupByItemNode {
      return node.kind === 'GroupByItemNode'
    },

    create(groupBy) {
      return freeze({
        kind: 'GroupByItemNode',
        groupBy,
      })
    },
  })
