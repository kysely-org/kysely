import { freeze } from '../util/object-utils.js'
import { ColumnUpdateNode } from './column-update-node.js'
import { JoinNode } from './join-node.js'
import { OperationNode } from './operation-node.js'
import { TableExpressionNode } from './operation-node-utils.js'
import { PrimitiveValueListNode } from './primitive-value-list-node.js'
import { ReturningNode } from './returning-node.js'
import { ValueListNode } from './value-list-node.js'
import { WhereNode } from './where-node.js'
import { WithNode } from './with-node.js'

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
export const UpdateQueryNode = freeze({
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
