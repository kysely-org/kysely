import { freeze } from '../util/object-utils'
import { ColumnUpdateNode } from './column-update-node'
import { JoinNode } from './join-node'
import { OperationNode } from './operation-node'
import { TableExpressionNode } from './operation-node-utils'
import { PrimitiveValueListNode } from './primitive-value-list-node'
import { ReturningNode } from './returning-node'
import { ValueListNode } from './value-list-node'
import { WhereNode } from './where-node'
import { WithNode } from './with-node'

export type UpdateValuesNode = ValueListNode | PrimitiveValueListNode

export interface UpdateQueryNode extends OperationNode {
  readonly kind: 'UpdateQueryNode'
  readonly table: TableExpressionNode
  readonly joins?: ReadonlyArray<JoinNode>
  readonly where?: WhereNode
  readonly updates?: ReadonlyArray<ColumnUpdateNode>
  readonly returning?: ReturningNode
  readonly with?: WithNode
}

/**
 * @internal
 */
export const updateQueryNode = freeze({
  is(node: OperationNode): node is UpdateQueryNode {
    return node.kind === 'UpdateQueryNode'
  },

  create(table: TableExpressionNode, withNode?: WithNode): UpdateQueryNode {
    return {
      kind: 'UpdateQueryNode',
      table,
      ...(withNode && { with: withNode }),
    }
  },

  cloneWithUpdates(
    updateQuery: UpdateQueryNode,
    updates: ReadonlyArray<ColumnUpdateNode>
  ): UpdateQueryNode {
    return freeze({
      ...updateQuery,
      updates: updateQuery.updates
        ? freeze([...updateQuery.updates, ...updates])
        : updates,
    })
  },
})
