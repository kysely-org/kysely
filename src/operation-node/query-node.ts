import { JoinNode } from './join-node'
import { OperationNode } from './operation-node'
import {
  SelectNode,
  SelectModifier,
  cloneSelectNodeWithSelections,
  cloneSelectNodeWithDistinctOnSelections,
  cloneSelectNodeWithModifier,
  createSelectNode,
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
import {
  cloneInsertNodeWithColumnsAndValues,
  createInsertNodeWithTable,
  InsertNode,
  InsertValuesNode,
} from './insert-node'
import { TableNode } from './table-node'
import { ColumnNode } from './column-node'
import { createDeleteNodeWithTable, DeleteNode } from './delete-node'
import {
  cloneReturningNodeWithSelections,
  createReturningNodeWithSelections,
  ReturningNode,
} from './returning-node'
import { assertNotNullOrUndefined } from '../utils/assert'

export type QueryModifier =
  | 'ForUpdate'
  | 'ForNoKeyUpdate'
  | 'ForShare'
  | 'ForKeyShare'
  | 'NoWait'
  | 'SkipLocked'

export interface QueryNode extends OperationNode {
  readonly kind: 'QueryNode'

  readonly select?: SelectNode
  readonly insert?: InsertNode
  readonly delete?: DeleteNode

  readonly joins?: ReadonlyArray<JoinNode>
  readonly where?: WhereNode
  readonly returning?: ReturningNode
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

export function createQueryNodeWithSelectFromItems(
  fromItems: ReadonlyArray<FromItemNode>
): QueryNode {
  return freeze({
    kind: 'QueryNode',
    select: createSelectNode(createFromNodeWithItems(fromItems)),
  })
}

export function createQueryNodeWithInsertTable(into: TableNode): QueryNode {
  return freeze({
    kind: 'QueryNode',
    insert: createInsertNodeWithTable(into),
  })
}

export function createQueryNodeWithDeleteTable(from: TableNode): QueryNode {
  return freeze({
    kind: 'QueryNode',
    delete: createDeleteNodeWithTable(from),
  })
}

export function cloneQueryNodeWithSelections(
  queryNode: QueryNode,
  selections: ReadonlyArray<SelectionNode>
): QueryNode {
  assertNotNullOrUndefined(queryNode.select)

  return freeze({
    ...queryNode,
    select: cloneSelectNodeWithSelections(queryNode.select, selections),
  })
}

export function cloneQueryNodeWithDistinctOnSelections(
  queryNode: QueryNode,
  selections: ReadonlyArray<SelectionNode>
): QueryNode {
  assertNotNullOrUndefined(queryNode.select)

  return freeze({
    ...queryNode,
    select: cloneSelectNodeWithDistinctOnSelections(
      queryNode.select,
      selections
    ),
  })
}

export function cloneQueryNodeWithSelectModifier(
  queryNode: QueryNode,
  modifier: SelectModifier
): QueryNode {
  assertNotNullOrUndefined(queryNode.select)

  return freeze({
    ...queryNode,
    select: cloneSelectNodeWithModifier(queryNode.select, modifier),
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

export function cloneQueryNodeWithInsertColumnsAndValues(
  queryNode: QueryNode,
  columns: ReadonlyArray<ColumnNode>,
  values: ReadonlyArray<InsertValuesNode>
): QueryNode {
  return freeze({
    ...queryNode,
    insert: cloneInsertNodeWithColumnsAndValues(
      queryNode.insert!,
      columns,
      values
    ),
  })
}

export function cloneQueryNodeWithReturningSelections(
  queryNode: QueryNode,
  selections: ReadonlyArray<SelectionNode>
): QueryNode {
  return freeze({
    ...queryNode,
    returning: queryNode.returning
      ? cloneReturningNodeWithSelections(queryNode.returning, selections)
      : createReturningNodeWithSelections(selections),
  })
}
