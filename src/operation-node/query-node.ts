import { JoinNode } from './join-node'
import { OperationNode } from './operation-node'
import {
  SelectNode,
  SelectModifier,
  cloneSelectNodeWithSelections,
  cloneSelectNodeWithDistinctOnSelections,
  createSelectNodeWithDistinctOnSelections,
  createSelectNodeWithSelections,
  cloneSelectNodeWithModifier,
  createSelectNodeWithModifier,
} from './select-node'
import { SelectionNode } from './selection-node'
import { freeze } from '../utils/object-utils'
import {
  cloneFromNodeWithItems,
  createFromNodeWithItems,
  FromItemNode,
  FromNode,
} from './from-node'
import {
  cloneWhereNodeWithFilter,
  createWhereNodeWithFilter,
  WhereChildNode,
  WhereNode,
} from './where-node'
import { InsertNode } from './insert-node'

export type QueryModifier =
  | 'ForUpdate'
  | 'ForNoKeyUpdate'
  | 'ForShare'
  | 'ForKeyShare'
  | 'NoWait'
  | 'SkipLocked'

export interface QueryNode extends OperationNode {
  readonly kind: 'QueryNode'
  readonly from?: FromNode
  readonly joins?: ReadonlyArray<JoinNode>
  readonly where?: WhereNode
  readonly select?: SelectNode
  readonly insert?: InsertNode
  readonly modifier?: QueryModifier
}

export function isQueryNode(node: OperationNode): node is QueryNode {
  return node.kind === 'QueryNode'
}

export function createQueryNode(): QueryNode {
  return freeze({
    kind: 'QueryNode',
  })
}

export function createQueryWithFromItems(
  fromItems: ReadonlyArray<FromItemNode>
): QueryNode {
  return freeze({
    kind: 'QueryNode',
    from: createFromNodeWithItems(fromItems),
  })
}

export function cloneQueryNodeWithSelections(
  queryNode: QueryNode,
  selections: ReadonlyArray<SelectionNode>
): QueryNode {
  return freeze({
    ...queryNode,
    select: queryNode.select
      ? cloneSelectNodeWithSelections(queryNode.select, selections)
      : createSelectNodeWithSelections(selections),
  })
}

export function cloneQueryNodeWithDistinctOnSelections(
  queryNode: QueryNode,
  selections: ReadonlyArray<SelectionNode>
): QueryNode {
  return freeze({
    ...queryNode,
    select: queryNode.select
      ? cloneSelectNodeWithDistinctOnSelections(queryNode.select, selections)
      : createSelectNodeWithDistinctOnSelections(selections),
  })
}

export function cloneQueryNodeWithSelectModifier(
  queryNode: QueryNode,
  modifier: SelectModifier
): QueryNode {
  return freeze({
    ...queryNode,
    select: queryNode.select
      ? cloneSelectNodeWithModifier(queryNode.select, modifier)
      : createSelectNodeWithModifier(modifier),
  })
}

export function cloneQueryNodeWithModifier(
  queryNode: QueryNode,
  modifier: QueryModifier
): QueryNode {
  return freeze({
    ...queryNode,
    modifier,
  })
}

export function cloneQueryNodeWithFroms(
  queryNode: QueryNode,
  froms: ReadonlyArray<FromItemNode>
): QueryNode {
  return freeze({
    ...queryNode,
    from: queryNode.from
      ? cloneFromNodeWithItems(queryNode.from, froms)
      : createFromNodeWithItems(froms),
  })
}

export function cloneQueryNodeWithWhere(
  queryNode: QueryNode,
  op: 'and' | 'or',
  filter: WhereChildNode
): QueryNode {
  return freeze({
    ...queryNode,
    where: queryNode.where
      ? cloneWhereNodeWithFilter(queryNode.where, op, filter)
      : createWhereNodeWithFilter(filter),
  })
}

export function cloneQueryNodeWithJoin(
  queryNode: QueryNode,
  join: JoinNode
): QueryNode {
  return freeze({
    ...queryNode,
    joins: queryNode.joins
      ? freeze([...queryNode.joins, join])
      : freeze([join]),
  })
}

export function cloneQueryNodeWithInsert(
  queryNode: QueryNode,
  insert: InsertNode
): QueryNode {
  return freeze({
    ...queryNode,
    from: undefined,
    insert,
  })
}
