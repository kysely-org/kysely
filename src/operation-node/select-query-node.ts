import { freeze } from '../utils/object-utils'
import { createFromNodeWithItems, FromItemNode, FromNode } from './from-node'
import { JoinNode } from './join-node'
import { OperationNode } from './operation-node'
import { OrderByItemNode } from './order-by-item-node'
import {
  cloneOrderByNodeWithItem,
  createOrderByNode,
  OrderByNode,
} from './order-by-node'
import { SelectionNode } from './selection-node'
import { WhereNode } from './where-node'

export type SelectModifier =
  | 'Distinct'
  | 'ForUpdate'
  | 'ForNoKeyUpdate'
  | 'ForShare'
  | 'ForKeyShare'
  | 'NoWait'
  | 'SkipLocked'

export interface SelectQueryNode extends OperationNode {
  readonly kind: 'SelectQueryNode'
  readonly from: FromNode
  readonly selections?: ReadonlyArray<SelectionNode>
  readonly distinctOnSelections?: ReadonlyArray<SelectionNode>
  readonly joins?: ReadonlyArray<JoinNode>
  readonly orderBy?: OrderByNode
  readonly where?: WhereNode
  readonly modifier?: SelectModifier
}

export function isSelectQueryNode(
  node: OperationNode
): node is SelectQueryNode {
  return node.kind === 'SelectQueryNode'
}

export function createSelectQueryNodeWithFromItems(
  fromItems: ReadonlyArray<FromItemNode>
): SelectQueryNode {
  return freeze({
    kind: 'SelectQueryNode',
    from: createFromNodeWithItems(fromItems),
  })
}

export function cloneSelectQueryNodeWithSelections(
  select: SelectQueryNode,
  selections: ReadonlyArray<SelectionNode>
): SelectQueryNode {
  return freeze({
    ...select,
    selections: select.selections
      ? freeze([...select.selections, ...selections])
      : freeze(selections),
  })
}

export function cloneSelectQueryNodeWithDistinctOnSelections(
  select: SelectQueryNode,
  selections: ReadonlyArray<SelectionNode>
): SelectQueryNode {
  return freeze({
    ...select,
    distinctOnSelections: select.distinctOnSelections
      ? freeze([...select.distinctOnSelections, ...selections])
      : freeze(selections),
  })
}

export function cloneSelectQueryNodeWithModifier(
  select: SelectQueryNode,
  modifier: SelectModifier
): SelectQueryNode {
  return freeze({
    ...select,
    modifier,
  })
}

export function cloneSelectQueryNodeWithOrderByItem(
  selectNode: SelectQueryNode,
  item: OrderByItemNode
): SelectQueryNode {
  return freeze({
    ...selectNode,
    orderBy: selectNode.orderBy
      ? cloneOrderByNodeWithItem(selectNode.orderBy, item)
      : createOrderByNode(item),
  })
}
