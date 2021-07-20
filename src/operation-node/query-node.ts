import { insertQueryNode, InsertQueryNode } from './insert-query-node'
import { selectQueryNode, SelectQueryNode } from './select-query-node'
import { updateQueryNode, UpdateQueryNode } from './update-query-node'
import { deleteQueryNode, DeleteQueryNode } from './delete-query-node'
import { whereNode, WhereChildNode } from './where-node'
import { freeze } from '../util/object-utils'
import { JoinNode } from './join-node'
import { SelectionNode } from './selection-node'
import { returningNode } from './returning-node'
import { OperationNode } from './operation-node'

export type QueryNode =
  | SelectQueryNode
  | DeleteQueryNode
  | InsertQueryNode
  | UpdateQueryNode

export type MutatingQueryNode =
  | DeleteQueryNode
  | InsertQueryNode
  | UpdateQueryNode

export type FilterableQueryNode =
  | SelectQueryNode
  | DeleteQueryNode
  | UpdateQueryNode

export const queryNode = freeze({
  is(node: OperationNode): node is QueryNode {
    return (
      deleteQueryNode.is(node) ||
      insertQueryNode.is(node) ||
      updateQueryNode.is(node) ||
      selectQueryNode.is(node)
    )
  },

  isMutating(node: OperationNode): node is MutatingQueryNode {
    return (
      deleteQueryNode.is(node) ||
      insertQueryNode.is(node) ||
      updateQueryNode.is(node)
    )
  },

  isFilterable(node: OperationNode): node is FilterableQueryNode {
    return (
      selectQueryNode.is(node) ||
      deleteQueryNode.is(node) ||
      updateQueryNode.is(node)
    )
  },

  cloneWithWhere<T extends FilterableQueryNode>(
    node: T,
    op: 'and' | 'or',
    filter: WhereChildNode
  ): T {
    return freeze({
      ...node,
      where: node.where
        ? whereNode.cloneWithFilter(node.where, op, filter)
        : whereNode.create(filter),
    })
  },

  cloneWithJoin<T extends FilterableQueryNode>(node: T, join: JoinNode): T {
    return freeze({
      ...node,
      joins: node.joins ? freeze([...node.joins, join]) : freeze([join]),
    })
  },

  cloneWithReturning<T extends MutatingQueryNode>(
    node: T,
    selections: ReadonlyArray<SelectionNode>
  ): T {
    return freeze({
      ...node,
      returning: node.returning
        ? returningNode.cloneWithSelections(node.returning, selections)
        : returningNode.create(selections),
    })
  },
})
