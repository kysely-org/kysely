import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'
import type { GroupByItemNode } from './group-by-item-node.js'

export interface GroupByNode extends OperationNode {
  readonly kind: 'GroupByNode'
  readonly items: ReadonlyArray<GroupByItemNode>
}

type GroupByNodeFactory = Readonly<{
  is(node: OperationNode): node is GroupByNode
  create(items: ReadonlyArray<GroupByItemNode>): Readonly<GroupByNode>
  cloneWithItems(
    groupBy: GroupByNode,
    items: ReadonlyArray<GroupByItemNode>,
  ): Readonly<GroupByNode>
}>

/**
 * @internal
 */
export const GroupByNode: GroupByNodeFactory = freeze<GroupByNodeFactory>({
  is(node): node is GroupByNode {
    return node.kind === 'GroupByNode'
  },

  create(items) {
    return freeze({
      kind: 'GroupByNode',
      items: freeze(items),
    })
  },

  cloneWithItems(groupBy, items) {
    return freeze({
      ...groupBy,
      items: freeze([...groupBy.items, ...items]),
    })
  },
})
