import { freeze } from '../util/object-utils.js'
import { ColumnUpdateNode } from './column-update-node.js'
import { JoinNode } from './join-node.js'
import { OperationNode } from './operation-node.js'
import { PrimitiveValueListNode } from './primitive-value-list-node.js'
import { ReturningNode } from './returning-node.js'
import { ValueListNode } from './value-list-node.js'
import { WhereNode } from './where-node.js'
import { WithNode } from './with-node.js'
import { FromNode } from './from-node.js'
import { ExplainNode } from './explain-node.js'
import { LimitNode } from './limit-node.js'
import { TopNode } from './top-node.js'
import { OutputNode } from './output-node.js'
import { ListNode } from './list-node.js'
import { OrderByNode } from './order-by-node.js'

export type UpdateValuesNode = ValueListNode | PrimitiveValueListNode

export interface UpdateQueryNode extends OperationNode {
  readonly kind: 'UpdateQueryNode'
  readonly table?: OperationNode
  readonly from?: FromNode
  readonly joins?: ReadonlyArray<JoinNode>
  readonly where?: WhereNode
  readonly updates?: ReadonlyArray<ColumnUpdateNode>
  readonly returning?: ReturningNode
  readonly with?: WithNode
  readonly explain?: ExplainNode
  readonly endModifiers?: ReadonlyArray<OperationNode>
  readonly limit?: LimitNode
  readonly top?: TopNode
  readonly output?: OutputNode
  readonly orderBy?: OrderByNode
}

/**
 * @internal
 */
export const UpdateQueryNode = freeze({
  is(node: OperationNode): node is UpdateQueryNode {
    return node.kind === 'UpdateQueryNode'
  },

  create(
    tables: ReadonlyArray<OperationNode>,
    withNode?: WithNode,
  ): UpdateQueryNode {
    return freeze({
      kind: 'UpdateQueryNode',
      // For backwards compatibility, use the raw table node when there's only one table
      // and don't rename the property to something like `tables`.
      table: tables.length === 1 ? tables[0] : ListNode.create(tables),
      ...(withNode && { with: withNode }),
    })
  },

  createWithoutTable(): UpdateQueryNode {
    return freeze({
      kind: 'UpdateQueryNode',
    })
  },

  cloneWithFromItems(
    updateQuery: UpdateQueryNode,
    fromItems: ReadonlyArray<OperationNode>,
  ): UpdateQueryNode {
    return freeze({
      ...updateQuery,
      from: updateQuery.from
        ? FromNode.cloneWithFroms(updateQuery.from, fromItems)
        : FromNode.create(fromItems),
    })
  },

  cloneWithUpdates(
    updateQuery: UpdateQueryNode,
    updates: ReadonlyArray<ColumnUpdateNode>,
  ): UpdateQueryNode {
    return freeze({
      ...updateQuery,
      updates: updateQuery.updates
        ? freeze([...updateQuery.updates, ...updates])
        : updates,
    })
  },

  cloneWithLimit(
    updateQuery: UpdateQueryNode,
    limit: LimitNode,
  ): UpdateQueryNode {
    return freeze({
      ...updateQuery,
      limit,
    })
  },
})
