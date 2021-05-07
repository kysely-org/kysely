import { SelectQueryNode } from './select-query-node'
import { DeleteQueryNode } from './delete-query-node'
import {
  cloneWhereNodeWithFilter,
  createWhereNodeWithFilter,
  WhereChildNode,
} from './where-node'
import { freeze } from '../utils/object-utils'
import { InsertQueryNode } from './insert-query-node'
import { JoinNode } from './join-node'
import { SelectionNode } from './selection-node'
import {
  cloneReturningNodeWithSelections,
  createReturningNodeWithSelections,
} from './returning-node'

export type QueryNode = SelectQueryNode | DeleteQueryNode | InsertQueryNode

export function cloneQueryNodeWithWhere<
  T extends SelectQueryNode | DeleteQueryNode
>(node: T, op: 'and' | 'or', filter: WhereChildNode): T {
  return freeze({
    ...node,
    where: node.where
      ? cloneWhereNodeWithFilter(node.where, op, filter)
      : createWhereNodeWithFilter(filter),
  })
}

export function cloneQueryNodeWithJoin<
  T extends SelectQueryNode | DeleteQueryNode
>(node: T, join: JoinNode): T {
  return freeze({
    ...node,
    joins: node.joins ? freeze([...node.joins, join]) : freeze([join]),
  })
}

export function cloneQueryNodeWithReturningSelections<
  T extends InsertQueryNode | DeleteQueryNode
>(node: T, selections: ReadonlyArray<SelectionNode>): T {
  return freeze({
    ...node,
    returning: node.returning
      ? cloneReturningNodeWithSelections(node.returning, selections)
      : createReturningNodeWithSelections(selections),
  })
}
