import { SelectQueryNode } from './select-query-node'
import { DeleteQueryNode, isDeleteQueryNode } from './delete-query-node'
import {
  cloneWhereNodeWithFilter,
  createWhereNodeWithFilter,
  WhereChildNode,
} from './where-node'
import { freeze } from '../utils/object-utils'
import { InsertQueryNode, isInsertQueryNode } from './insert-query-node'
import { JoinNode } from './join-node'
import { SelectionNode } from './selection-node'
import {
  cloneReturningNodeWithSelections,
  createReturningNodeWithSelections,
} from './returning-node'
import { isUpdateQueryNode, UpdateQueryNode } from './update-query-node'
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

export function isMutatingQueryNode(
  node: OperationNode
): node is MutatingQueryNode {
  return (
    isDeleteQueryNode(node) ||
    isInsertQueryNode(node) ||
    isUpdateQueryNode(node)
  )
}

export function cloneQueryNodeWithWhere<
  T extends SelectQueryNode | DeleteQueryNode | UpdateQueryNode
>(node: T, op: 'and' | 'or', filter: WhereChildNode): T {
  return freeze({
    ...node,
    where: node.where
      ? cloneWhereNodeWithFilter(node.where, op, filter)
      : createWhereNodeWithFilter(filter),
  })
}

export function cloneQueryNodeWithJoin<
  T extends SelectQueryNode | DeleteQueryNode | UpdateQueryNode
>(node: T, join: JoinNode): T {
  return freeze({
    ...node,
    joins: node.joins ? freeze([...node.joins, join]) : freeze([join]),
  })
}

export function cloneQueryNodeWithReturningSelections<
  T extends InsertQueryNode | DeleteQueryNode | UpdateQueryNode
>(node: T, selections: ReadonlyArray<SelectionNode>): T {
  return freeze({
    ...node,
    returning: node.returning
      ? cloneReturningNodeWithSelections(node.returning, selections)
      : createReturningNodeWithSelections(selections),
  })
}
