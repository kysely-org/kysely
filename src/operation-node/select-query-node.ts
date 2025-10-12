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
import { FetchNode } from './fetch-node.js'
import { TopNode } from './top-node.js'
import { QueryNode } from './query-node.js'

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
  readonly fetch?: FetchNode
  readonly top?: TopNode
}

type SelectQueryNodeFactory = Readonly<{
  is(node: OperationNode): node is SelectQueryNode
  create(withNode?: WithNode): Readonly<SelectQueryNode>
  createFrom(
    fromItems: ReadonlyArray<OperationNode>,
    withNode?: WithNode,
  ): Readonly<SelectQueryNode>
  cloneWithSelections(
    select: SelectQueryNode,
    selections: ReadonlyArray<SelectionNode>,
  ): Readonly<SelectQueryNode>
  cloneWithDistinctOn(
    select: SelectQueryNode,
    expressions: ReadonlyArray<OperationNode>,
  ): Readonly<SelectQueryNode>
  cloneWithFrontModifier(
    select: SelectQueryNode,
    modifier: SelectModifierNode,
  ): Readonly<SelectQueryNode>
  cloneWithOrderByItems(
    node: SelectQueryNode,
    items: ReadonlyArray<OrderByItemNode>,
  ): Readonly<SelectQueryNode>
  cloneWithGroupByItems(
    selectNode: SelectQueryNode,
    items: ReadonlyArray<GroupByItemNode>,
  ): Readonly<SelectQueryNode>
  cloneWithLimit(
    selectNode: SelectQueryNode,
    limit: LimitNode,
  ): Readonly<SelectQueryNode>
  cloneWithOffset(
    selectNode: SelectQueryNode,
    offset: OffsetNode,
  ): Readonly<SelectQueryNode>
  cloneWithFetch(
    selectNode: SelectQueryNode,
    fetch: FetchNode,
  ): Readonly<SelectQueryNode>
  cloneWithHaving(
    selectNode: SelectQueryNode,
    operation: OperationNode,
  ): Readonly<SelectQueryNode>
  cloneWithSetOperations(
    selectNode: SelectQueryNode,
    setOperations: ReadonlyArray<SetOperationNode>,
  ): Readonly<SelectQueryNode>
  cloneWithoutSelections(select: SelectQueryNode): Readonly<SelectQueryNode>
  cloneWithoutLimit(select: SelectQueryNode): Readonly<SelectQueryNode>
  cloneWithoutOffset(select: SelectQueryNode): Readonly<SelectQueryNode>
  cloneWithoutOrderBy(node: SelectQueryNode): Readonly<SelectQueryNode>
  cloneWithoutGroupBy(select: SelectQueryNode): Readonly<SelectQueryNode>
}>

/**
 * @internal
 */
export const SelectQueryNode: SelectQueryNodeFactory =
  freeze<SelectQueryNodeFactory>({
    is(node): node is SelectQueryNode {
      return node.kind === 'SelectQueryNode'
    },

    create(withNode?) {
      return freeze({
        kind: 'SelectQueryNode',
        ...(withNode && { with: withNode }),
      })
    },

    createFrom(fromItems, withNode?) {
      return freeze({
        kind: 'SelectQueryNode',
        from: FromNode.create(fromItems),
        ...(withNode && { with: withNode }),
      })
    },

    cloneWithSelections(select, selections) {
      return freeze({
        ...select,
        selections: select.selections
          ? freeze([...select.selections, ...selections])
          : freeze(selections),
      })
    },

    cloneWithDistinctOn(select, expressions) {
      return freeze({
        ...select,
        distinctOn: select.distinctOn
          ? freeze([...select.distinctOn, ...expressions])
          : freeze(expressions),
      })
    },

    cloneWithFrontModifier(select, modifier) {
      return freeze({
        ...select,
        frontModifiers: select.frontModifiers
          ? freeze([...select.frontModifiers, modifier])
          : freeze([modifier]),
      })
    },

    // TODO: remove in v0.29
    /**
     * @deprecated Use `QueryNode.cloneWithoutOrderBy` instead.
     */
    cloneWithOrderByItems: (node, items) =>
      QueryNode.cloneWithOrderByItems(node, items),

    cloneWithGroupByItems(selectNode, items) {
      return freeze({
        ...selectNode,
        groupBy: selectNode.groupBy
          ? GroupByNode.cloneWithItems(selectNode.groupBy, items)
          : GroupByNode.create(items),
      })
    },

    cloneWithLimit(selectNode, limit) {
      return freeze({
        ...selectNode,
        limit,
      })
    },

    cloneWithOffset(selectNode, offset) {
      return freeze({
        ...selectNode,
        offset,
      })
    },

    cloneWithFetch(selectNode, fetch) {
      return freeze({
        ...selectNode,
        fetch,
      })
    },

    cloneWithHaving(selectNode, operation) {
      return freeze({
        ...selectNode,
        having: selectNode.having
          ? HavingNode.cloneWithOperation(selectNode.having, 'And', operation)
          : HavingNode.create(operation),
      })
    },

    cloneWithSetOperations(selectNode, setOperations) {
      return freeze({
        ...selectNode,
        setOperations: selectNode.setOperations
          ? freeze([...selectNode.setOperations, ...setOperations])
          : freeze([...setOperations]),
      })
    },

    cloneWithoutSelections(select) {
      return freeze({
        ...select,
        selections: [],
      })
    },

    cloneWithoutLimit(select) {
      return freeze({
        ...select,
        limit: undefined,
      })
    },

    cloneWithoutOffset(select) {
      return freeze({
        ...select,
        offset: undefined,
      })
    },

    // TODO: remove in v0.29
    /**
     * @deprecated Use `QueryNode.cloneWithoutOrderBy` instead.
     */
    cloneWithoutOrderBy: (node) => QueryNode.cloneWithoutOrderBy(node),

    cloneWithoutGroupBy(select) {
      return freeze({
        ...select,
        groupBy: undefined,
      })
    },
  })
