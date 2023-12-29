import { freeze } from '../util/object-utils.js'
import { FromNode } from './from-node.js'
import { GroupByItemNode } from './group-by-item-node.js'
import { GroupByNode } from './group-by-node.js'
import { HavingNode } from './having-node.js'
import { JoinNode } from './join-node.js'
import { LimitNode } from './limit-node.js'
import { OffsetNode } from './offset-node.js'
import { OperationNode } from './operation-node.js'
import { OrderByItemNode } from './order-by-item-node.js'
import { OrderByNode } from './order-by-node.js'
import { SelectionNode } from './selection-node.js'
import { WhereNode } from './where-node.js'
import { WithNode } from './with-node.js'
import { SelectModifierNode } from './select-modifier-node.js'
import { ExplainNode } from './explain-node.js'
import { SetOperationNode } from './set-operation-node.js'
import { TopNode } from './top-node.js'

export interface SelectQueryNode extends OperationNode {
  readonly kind: 'SelectQueryNode'
  readonly from?: FromNode
  readonly selections?: ReadonlyArray<SelectionNode>
  readonly distinctOn?: ReadonlyArray<OperationNode>
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
  readonly explain?: ExplainNode
  readonly setOperations?: ReadonlyArray<SetOperationNode>
  readonly top?: TopNode
}

/**
 * @internal
 */
export const SelectQueryNode = freeze({
  is(node: OperationNode): node is SelectQueryNode {
    return node.kind === 'SelectQueryNode'
  },

  create(withNode?: WithNode): SelectQueryNode {
    return freeze({
      kind: 'SelectQueryNode',
      ...(withNode && { with: withNode }),
    })
  },

  createFrom(
    fromItems: ReadonlyArray<OperationNode>,
    withNode?: WithNode,
  ): SelectQueryNode {
    return freeze({
      kind: 'SelectQueryNode',
      from: FromNode.create(fromItems),
      ...(withNode && { with: withNode }),
    })
  },

  cloneWithSelections(
    select: SelectQueryNode,
    selections: ReadonlyArray<SelectionNode>,
  ): SelectQueryNode {
    return freeze({
      ...select,
      selections: select.selections
        ? freeze([...select.selections, ...selections])
        : freeze(selections),
    })
  },

  cloneWithDistinctOn(
    select: SelectQueryNode,
    expressions: ReadonlyArray<OperationNode>,
  ): SelectQueryNode {
    return freeze({
      ...select,
      distinctOn: select.distinctOn
        ? freeze([...select.distinctOn, ...expressions])
        : freeze(expressions),
    })
  },

  cloneWithFrontModifier(
    select: SelectQueryNode,
    modifier: SelectModifierNode,
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
    modifier: SelectModifierNode,
  ): SelectQueryNode {
    return freeze({
      ...select,
      endModifiers: select.endModifiers
        ? freeze([...select.endModifiers, modifier])
        : freeze([modifier]),
    })
  },

  cloneWithOrderByItems(
    selectNode: SelectQueryNode,
    items: ReadonlyArray<OrderByItemNode>,
  ): SelectQueryNode {
    return freeze({
      ...selectNode,
      orderBy: selectNode.orderBy
        ? OrderByNode.cloneWithItems(selectNode.orderBy, items)
        : OrderByNode.create(items),
    })
  },

  cloneWithGroupByItems(
    selectNode: SelectQueryNode,
    items: ReadonlyArray<GroupByItemNode>,
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
    limit: LimitNode,
  ): SelectQueryNode {
    return freeze({
      ...selectNode,
      limit,
    })
  },

  cloneWithOffset(
    selectNode: SelectQueryNode,
    offset: OffsetNode,
  ): SelectQueryNode {
    return freeze({
      ...selectNode,
      offset,
    })
  },

  cloneWithHaving(
    selectNode: SelectQueryNode,
    operation: OperationNode,
  ): SelectQueryNode {
    return freeze({
      ...selectNode,
      having: selectNode.having
        ? HavingNode.cloneWithOperation(selectNode.having, 'And', operation)
        : HavingNode.create(operation),
    })
  },

  cloneWithSetOperations(
    selectNode: SelectQueryNode,
    setOperations: ReadonlyArray<SetOperationNode>,
  ): SelectQueryNode {
    return freeze({
      ...selectNode,
      setOperations: selectNode.setOperations
        ? freeze([...selectNode.setOperations, ...setOperations])
        : freeze([...setOperations]),
    })
  },

  cloneWithTop(selectNode: SelectQueryNode, top: TopNode): SelectQueryNode {
    return freeze({
      ...selectNode,
      top,
    })
  },

  cloneWithoutSelections(select: SelectQueryNode): SelectQueryNode {
    return freeze({
      ...select,
      selections: [],
    })
  },

  cloneWithoutLimit(select: SelectQueryNode): SelectQueryNode {
    return freeze({
      ...select,
      limit: undefined,
    })
  },

  cloneWithoutOffset(select: SelectQueryNode): SelectQueryNode {
    return freeze({
      ...select,
      offset: undefined,
    })
  },

  cloneWithoutOrderBy(select: SelectQueryNode): SelectQueryNode {
    return freeze({
      ...select,
      orderBy: undefined,
    })
  },
})
