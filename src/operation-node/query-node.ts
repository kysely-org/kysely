import { InsertQueryNode } from './insert-query-node.js'
import { SelectQueryNode } from './select-query-node.js'
import { UpdateQueryNode } from './update-query-node.js'
import { DeleteQueryNode } from './delete-query-node.js'
import { WhereNode } from './where-node.js'
import { freeze } from '../util/object-utils.js'
import { JoinNode } from './join-node.js'
import { SelectionNode } from './selection-node.js'
import { ReturningNode } from './returning-node.js'
import { OperationNode } from './operation-node.js'
import { ExplainNode } from './explain-node.js'
import { ExplainFormat } from '../util/explainable.js'
import { Expression } from '../expression/expression.js'
import { MergeQueryNode } from './merge-query-node.js'
import { TopNode } from './top-node.js'
import { OutputNode } from './output-node.js'
import { OrderByNode } from './order-by-node.js'
import { OrderByItemNode } from './order-by-item-node.js'

export type QueryNode =
  | SelectQueryNode
  | InsertQueryNode
  | UpdateQueryNode
  | DeleteQueryNode
  | MergeQueryNode

type HasJoins = { joins?: ReadonlyArray<JoinNode> }
type HasWhere = { where?: WhereNode }
type HasReturning = { returning?: ReturningNode }
type HasExplain = { explain?: ExplainNode }
type HasTop = { top?: TopNode }
type HasOutput = { output?: OutputNode }
type HasEndModifiers = { endModifiers?: ReadonlyArray<OperationNode> }
type HasOrderBy = { orderBy?: OrderByNode }

type QueryNodeFactory = Readonly<{
  is(node: OperationNode): node is QueryNode
  cloneWithEndModifier<T extends HasEndModifiers>(
    node: T,
    modifier: OperationNode,
  ): Readonly<T>
  cloneWithWhere<T extends HasWhere>(
    node: T,
    operation: OperationNode,
  ): Readonly<T>
  cloneWithJoin<T extends HasJoins>(node: T, join: JoinNode): Readonly<T>
  cloneWithReturning<T extends HasReturning>(
    node: T,
    selections: ReadonlyArray<SelectionNode>,
  ): Readonly<T>
  cloneWithoutReturning<T extends HasReturning>(node: T): Readonly<T>
  cloneWithoutWhere<T extends HasWhere>(node: T): Readonly<T>
  cloneWithExplain<T extends HasExplain>(
    node: T,
    format: ExplainFormat | undefined,
    options: Expression<any> | undefined,
  ): Readonly<T>
  cloneWithTop<T extends HasTop>(node: T, top: TopNode): Readonly<T>
  cloneWithOutput<T extends HasOutput>(
    node: T,
    selections: ReadonlyArray<SelectionNode>,
  ): Readonly<T>
  cloneWithOrderByItems<T extends HasOrderBy>(
    node: T,
    items: ReadonlyArray<OrderByItemNode>,
  ): Readonly<T>
  cloneWithoutOrderBy<T extends HasOrderBy>(node: T): Readonly<T>
}>

/**
 * @internal
 */
export const QueryNode: QueryNodeFactory = freeze<QueryNodeFactory>({
  is(node): node is QueryNode {
    return (
      SelectQueryNode.is(node) ||
      InsertQueryNode.is(node) ||
      UpdateQueryNode.is(node) ||
      DeleteQueryNode.is(node) ||
      MergeQueryNode.is(node)
    )
  },

  cloneWithEndModifier(node, modifier) {
    return freeze({
      ...node,
      endModifiers: node.endModifiers
        ? freeze([...node.endModifiers, modifier])
        : freeze([modifier]),
    })
  },

  cloneWithWhere(node, operation) {
    return freeze({
      ...node,
      where: node.where
        ? WhereNode.cloneWithOperation(node.where, 'And', operation)
        : WhereNode.create(operation),
    })
  },

  cloneWithJoin(node, join) {
    return freeze({
      ...node,
      joins: node.joins ? freeze([...node.joins, join]) : freeze([join]),
    })
  },

  cloneWithReturning(node, selections) {
    return freeze({
      ...node,
      returning: node.returning
        ? ReturningNode.cloneWithSelections(node.returning, selections)
        : ReturningNode.create(selections),
    })
  },

  cloneWithoutReturning(node) {
    return freeze({
      ...node,
      returning: undefined,
    })
  },

  cloneWithoutWhere(node) {
    return freeze({
      ...node,
      where: undefined,
    })
  },

  cloneWithExplain(node, format, options) {
    return freeze({
      ...node,
      explain: ExplainNode.create(format, options?.toOperationNode()),
    })
  },

  cloneWithTop(node, top) {
    return freeze({
      ...node,
      top,
    })
  },

  cloneWithOutput(node, selections) {
    return freeze({
      ...node,
      output: node.output
        ? OutputNode.cloneWithSelections(node.output, selections)
        : OutputNode.create(selections),
    })
  },

  cloneWithOrderByItems(node, items) {
    return freeze({
      ...node,
      orderBy: node.orderBy
        ? OrderByNode.cloneWithItems(node.orderBy, items)
        : OrderByNode.create(items),
    })
  },

  cloneWithoutOrderBy(node) {
    return freeze({
      ...node,
      orderBy: undefined,
    })
  },
})
