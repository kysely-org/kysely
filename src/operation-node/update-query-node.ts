import { freeze } from '../utils/object-utils'
import { ColumnUpdateNode } from './column-update-node'
import { JoinNode } from './join-node'
import { OperationNode } from './operation-node'
import { TableExpressionNode } from './operation-node-utils'
import { PrimitiveValueListNode } from './primitive-value-list-node'
import { ReturningNode } from './returning-node'
import { ValueListNode } from './value-list-node'
import { WhereNode } from './where-node'

export type UpdateValuesNode = ValueListNode | PrimitiveValueListNode

export interface UpdateQueryNode extends OperationNode {
  readonly kind: 'UpdateQueryNode'
  readonly table: TableExpressionNode
  readonly joins?: ReadonlyArray<JoinNode>
  readonly where?: WhereNode
  readonly updates?: ReadonlyArray<ColumnUpdateNode>
  readonly returning?: ReturningNode
}

export function isUpdateQueryNode(
  node: OperationNode
): node is UpdateQueryNode {
  return node.kind === 'UpdateQueryNode'
}

export function createUpdateQueryNodeWithTable(
  table: TableExpressionNode
): UpdateQueryNode {
  return {
    kind: 'UpdateQueryNode',
    table,
  }
}

export function cloneUpdateQueryNodeWithColumnUpdates(
  updateQuery: UpdateQueryNode,
  updates: ReadonlyArray<ColumnUpdateNode>
): UpdateQueryNode {
  return freeze({
    ...updateQuery,
    updates: updateQuery.updates
      ? [...updateQuery.updates, ...updates]
      : updates,
  })
}
