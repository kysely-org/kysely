import { AndNode, createAndNode } from './and-node'
import { FromNode } from './from-node'
import { JoinNode } from './join-node'
import { OperationNode } from './operation-node'
import { createOrNode, OrNode } from './or-node'
import { ParensNode } from './parens-node'
import { SelectNode, createSelectNode, SelectModifier } from './select-node'
import { SelectionNode } from './selection-node'
import { FilterNode } from './filter-node'
import { freeze } from '../utils/object-utils'

export type QueryModifier =
  | 'ForUpdate'
  | 'ForNoKeyUpdate'
  | 'ForShare'
  | 'ForKeyShare'
  | 'NoWait'
  | 'SkipLocked'

type WhereNode = FilterNode | AndNode | OrNode | ParensNode

export interface QueryNode extends OperationNode {
  readonly kind: 'QueryNode'
  readonly select?: SelectNode
  readonly from: ReadonlyArray<FromNode>
  readonly where?: WhereNode
  readonly modifier?: QueryModifier
  readonly joins: ReadonlyArray<JoinNode>
}

export function isQueryNode(node: OperationNode): node is QueryNode {
  return node.kind === 'QueryNode'
}

export function createQueryNode(): QueryNode {
  return freeze({
    kind: 'QueryNode',
    select: undefined,
    from: freeze([]),
    joins: freeze([]),
  })
}

export function cloneQueryNodeWithSelections(
  queryNode: QueryNode,
  selections: ReadonlyArray<SelectionNode>
): QueryNode {
  const select = queryNode.select ?? createSelectNode()

  return freeze({
    ...queryNode,
    select: freeze({
      ...select,
      selections: freeze([...select.selections, ...selections]),
    }),
  })
}

export function cloneQueryNodeWithDistinctOnSelections(
  queryNode: QueryNode,
  distinctOnSelections: ReadonlyArray<SelectionNode>
): QueryNode {
  const select = queryNode.select ?? createSelectNode()

  return freeze({
    ...queryNode,
    select: freeze({
      ...select,
      distinctOnSelections: freeze([
        ...select.distinctOnSelections,
        ...distinctOnSelections,
      ]),
    }),
  })
}

export function cloneQueryNodeWithSelectModifier(
  queryNode: QueryNode,
  modifier: SelectModifier
): QueryNode {
  const select = queryNode.select ?? createSelectNode()

  return freeze({
    ...queryNode,
    select: freeze({
      ...select,
      modifier,
    }),
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
  froms: ReadonlyArray<FromNode>
): QueryNode {
  return freeze({
    ...queryNode,
    from: freeze([...queryNode.from, ...froms]),
  })
}

export function cloneQueryNodeWithWhere(
  queryNode: QueryNode,
  op: 'and' | 'or',
  where: WhereNode
): QueryNode {
  return freeze({
    ...queryNode,
    where: queryNode.where
      ? op === 'and'
        ? createAndNode(queryNode.where, where)
        : createOrNode(queryNode.where, where)
      : where,
  })
}

export function cloneQueryNodeWithJoin(
  queryNode: QueryNode,
  join: JoinNode
): QueryNode {
  return freeze({
    ...queryNode,
    joins: freeze([...queryNode.joins, join]),
  })
}
