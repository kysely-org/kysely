import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { GroupByItemNode } from './group-by-item-node.js'

export interface GroupByNode extends OperationNode {
  readonly kind: 'GroupByNode'
  readonly items: ReadonlyArray<GroupByItemNode>
}

/**
 * @internal
 */
export const GroupByNode = freeze({
  is(node: OperationNode): node is GroupByNode {
    return node.kind === 'GroupByNode'
  },

  create(items: ReadonlyArray<GroupByItemNode>): GroupByNode {
    return freeze({
      kind: 'GroupByNode',
      items: freeze(items),
    })
  },

  cloneWithItems(
    orderBy: GroupByNode,
    items: ReadonlyArray<GroupByItemNode>
  ): GroupByNode {
    return freeze({
      ...orderBy,
      items: freeze([...orderBy.items, ...items]),
    })
  },
})
