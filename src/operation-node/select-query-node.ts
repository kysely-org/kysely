import { freeze } from '../util/object-utils'
import { FromNode, fromNode } from './from-node'
import { GroupByItemNode } from './group-by-item-node'
import { GroupByNode, groupByNode } from './group-by-node'
import { JoinNode } from './join-node'
import { LimitNode } from './limit-node'
import { OffsetNode } from './offset-node'
import { OperationNode } from './operation-node'
import { TableExpressionNode } from './operation-node-utils'
import { OrderByItemNode } from './order-by-item-node'
import { OrderByNode, orderByNode } from './order-by-node'
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
  readonly groupBy?: GroupByNode
  readonly orderBy?: OrderByNode
  readonly where?: WhereNode
  readonly modifier?: SelectModifier
  readonly limit?: LimitNode
  readonly offset?: OffsetNode
}

export const selectQueryNode = freeze({
  is(node: OperationNode): node is SelectQueryNode {
    return node.kind === 'SelectQueryNode'
  },

  create(fromItems: ReadonlyArray<TableExpressionNode>): SelectQueryNode {
    return freeze({
      kind: 'SelectQueryNode',
      from: fromNode.create(fromItems),
    })
  },

  cloneWithSelections(
    select: SelectQueryNode,
    selections: ReadonlyArray<SelectionNode>
  ): SelectQueryNode {
    return freeze({
      ...select,
      selections: select.selections
        ? freeze([...select.selections, ...selections])
        : freeze(selections),
    })
  },

  cloneWithDistinctOnSelections(
    select: SelectQueryNode,
    selections: ReadonlyArray<SelectionNode>
  ): SelectQueryNode {
    return freeze({
      ...select,
      distinctOnSelections: select.distinctOnSelections
        ? freeze([...select.distinctOnSelections, ...selections])
        : freeze(selections),
    })
  },

  cloneWithModifier(
    select: SelectQueryNode,
    modifier: SelectModifier
  ): SelectQueryNode {
    return freeze({
      ...select,
      modifier,
    })
  },

  cloneWithOrderByItem(
    selectNode: SelectQueryNode,
    item: OrderByItemNode
  ): SelectQueryNode {
    return freeze({
      ...selectNode,
      orderBy: selectNode.orderBy
        ? orderByNode.cloneWithItem(selectNode.orderBy, item)
        : orderByNode.create(item),
    })
  },

  cloneWithGroupByItems(
    selectNode: SelectQueryNode,
    items: ReadonlyArray<GroupByItemNode>
  ): SelectQueryNode {
    return freeze({
      ...selectNode,
      groupBy: selectNode.groupBy
        ? groupByNode.cloneWithItems(selectNode.groupBy, items)
        : groupByNode.create(items),
    })
  },

  cloneWithLimit(
    selectNode: SelectQueryNode,
    limit: LimitNode
  ): SelectQueryNode {
    return freeze({
      ...selectNode,
      limit,
    })
  },

  cloneWithOffset(
    selectNode: SelectQueryNode,
    offset: OffsetNode
  ): SelectQueryNode {
    return freeze({
      ...selectNode,
      offset,
    })
  },
})
