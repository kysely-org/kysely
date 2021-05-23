import { freeze } from '../utils/object-utils'
import { OperationNode } from './operation-node'
import { GroupByItemNode } from './group-by-item-node'

export interface GroupByNode extends OperationNode {
  readonly kind: 'GroupByNode'
  readonly items: ReadonlyArray<GroupByItemNode>
}

export function isGroupByNode(node: OperationNode): node is GroupByNode {
  return node.kind === 'GroupByNode'
}

export function createGroupByNode(
  items: ReadonlyArray<GroupByItemNode>
): GroupByNode {
  return freeze({
    kind: 'GroupByNode',
    items: freeze(items),
  })
}

export function cloneGroupByNodeWithItems(
  orderBy: GroupByNode,
  items: ReadonlyArray<GroupByItemNode>
): GroupByNode {
  return freeze({
    ...orderBy,
    items: freeze([...orderBy.items, ...items]),
  })
}
