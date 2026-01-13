import { freeze } from '../util/object-utils.js'
import type { ColumnUpdateNode } from './column-update-node.js'
import type { JoinNode } from './join-node.js'
import type { OperationNode } from './operation-node.js'
import type { ReturningNode } from './returning-node.js'
import type { WhereNode } from './where-node.js'
import type { WithNode } from './with-node.js'
import { FromNode } from './from-node.js'
import type { ExplainNode } from './explain-node.js'
import type { LimitNode } from './limit-node.js'
import type { TopNode } from './top-node.js'
import type { OutputNode } from './output-node.js'
import { ListNode } from './list-node.js'
import type { OrderByNode } from './order-by-node.js'

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

type UpdateQueryNodeFactory = Readonly<{
  is(node: OperationNode): node is UpdateQueryNode
  create(
    tables: ReadonlyArray<OperationNode>,
    withNode?: WithNode,
  ): Readonly<UpdateQueryNode>
  createWithoutTable(): Readonly<UpdateQueryNode>
  cloneWithFromItems(
    updateQuery: UpdateQueryNode,
    fromItems: ReadonlyArray<OperationNode>,
  ): Readonly<UpdateQueryNode>
  cloneWithUpdates(
    updateQuery: UpdateQueryNode,
    updates: ReadonlyArray<ColumnUpdateNode>,
  ): Readonly<UpdateQueryNode>
  cloneWithLimit(
    updateQuery: UpdateQueryNode,
    limit: LimitNode,
  ): Readonly<UpdateQueryNode>
}>

/**
 * @internal
 */
export const UpdateQueryNode: UpdateQueryNodeFactory =
  freeze<UpdateQueryNodeFactory>({
    is(node): node is UpdateQueryNode {
      return node.kind === 'UpdateQueryNode'
    },

    create(tables, withNode?) {
      return freeze({
        kind: 'UpdateQueryNode',
        // For backwards compatibility, use the raw table node when there's only one table
        // and don't rename the property to something like `tables`.
        table: tables.length === 1 ? tables[0] : ListNode.create(tables),
        ...(withNode && { with: withNode }),
      })
    },

    createWithoutTable() {
      return freeze({
        kind: 'UpdateQueryNode',
      })
    },

    cloneWithFromItems(updateQuery, fromItems) {
      return freeze({
        ...updateQuery,
        from: updateQuery.from
          ? FromNode.cloneWithFroms(updateQuery.from, fromItems)
          : FromNode.create(fromItems),
      })
    },

    cloneWithUpdates(updateQuery, updates) {
      return freeze({
        ...updateQuery,
        updates: updateQuery.updates
          ? freeze([...updateQuery.updates, ...updates])
          : updates,
      })
    },

    cloneWithLimit(updateQuery, limit) {
      return freeze({
        ...updateQuery,
        limit,
      })
    },
  })
