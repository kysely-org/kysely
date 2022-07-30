import { freeze } from '../util/object-utils.js'
import { FromNode } from './from-node.js'
import { GroupByItemNode } from './group-by-item-node.js'
import { GroupByNode } from './group-by-node.js'
import { HavingNode } from './having-node.js'
import { JoinNode } from './join-node.js'
import { LimitNode } from './limit-node.js'
import { OffsetNode } from './offset-node.js'
import { OperationNode } from './operation-node.js'
import {
  FilterExpressionNode,
  TableExpressionNode,
} from './operation-node-utils.js'
import { OrderByItemNode } from './order-by-item-node.js'
import { OrderByNode } from './order-by-node.js'
import { SelectionNode } from './selection-node.js'
import { WhereNode } from './where-node.js'
import { WithNode } from './with-node.js'
import { UnionNode } from './union-node.js'
import { SelectModifierNode } from './select-modifier-node.js'
import { ExplainNode } from './explain-node.js'

export interface SelectQueryNode extends OperationNode {
  readonly kind: 'SelectQueryNode'
  readonly from: FromNode
  readonly selections?: ReadonlyArray<SelectionNode>
  readonly distinctOnSelections?: ReadonlyArray<SelectionNode>
  readonly joins?: ReadonlyArray<JoinNode>
  readonly groupBy?: GroupByNode
  readonly orderBy?: OrderByNode
  readonly where?: WhereNode
  readonly frontModifiers?: ReadonlyArray<SelectModifierNode>
  readonly endModifiers?: ReadonlyArray<SelectModifierNode>
  readonly limit?: LimitNode
  readonly offset?: OffsetNode
  readonly with?: WithNode
  readonly having?: HavingNode
  readonly union?: ReadonlyArray<UnionNode>
  readonly explain?: ExplainNode
}

/**
 * @internal
 */
export const SelectQueryNode = freeze({
  is(node: OperationNode): node is SelectQueryNode {
    return node.kind === 'SelectQueryNode'
  },

  create(
    fromItems: ReadonlyArray<TableExpressionNode>,
    withNode?: WithNode
  ): SelectQueryNode {
    return freeze({
      kind: 'SelectQueryNode',
      from: FromNode.create(fromItems),
      ...(withNode && { with: withNode }),
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

  cloneWithFrontModifier(
    select: SelectQueryNode,
    modifier: SelectModifierNode
  ): SelectQueryNode {
    return freeze({
      ...select,
      frontModifiers: select.frontModifiers
        ? freeze([...select.frontModifiers, modifier])
        : freeze([modifier]),
    })
  },

  cloneWithEndModifier(
    select: SelectQueryNode,
    modifier: SelectModifierNode
  ): SelectQueryNode {
    return freeze({
      ...select,
      endModifiers: select.endModifiers
        ? freeze([...select.endModifiers, modifier])
        : freeze([modifier]),
    })
  },

  cloneWithOrderByItem(
    selectNode: SelectQueryNode,
    item: OrderByItemNode
  ): SelectQueryNode {
    return freeze({
      ...selectNode,
      orderBy: selectNode.orderBy
        ? OrderByNode.cloneWithItem(selectNode.orderBy, item)
        : OrderByNode.create(item),
    })
  },

  cloneWithGroupByItems(
    selectNode: SelectQueryNode,
    items: ReadonlyArray<GroupByItemNode>
  ): SelectQueryNode {
    return freeze({
      ...selectNode,
      groupBy: selectNode.groupBy
        ? GroupByNode.cloneWithItems(selectNode.groupBy, items)
        : GroupByNode.create(items),
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

  cloneWithHaving(
    selectNode: SelectQueryNode,
    filter: FilterExpressionNode
  ): SelectQueryNode {
    return freeze({
      ...selectNode,
      having: selectNode.having
        ? HavingNode.cloneWithFilter(selectNode.having, 'And', filter)
        : HavingNode.create(filter),
    })
  },

  cloneWithOrHaving(
    selectNode: SelectQueryNode,
    filter: FilterExpressionNode
  ): SelectQueryNode {
    return freeze({
      ...selectNode,
      having: selectNode.having
        ? HavingNode.cloneWithFilter(selectNode.having, 'Or', filter)
        : HavingNode.create(filter),
    })
  },

  cloneWithUnion(
    selectNode: SelectQueryNode,
    union: UnionNode
  ): SelectQueryNode {
    return freeze({
      ...selectNode,
      union: selectNode.union
        ? freeze([...selectNode.union, union])
        : freeze([union]),
    })
  },

  cloneWithExplain(
    selectNode: SelectQueryNode,
    explain: ExplainNode
  ): SelectQueryNode {
    return freeze({
      ...selectNode,
      explain,
    })
  },
})
