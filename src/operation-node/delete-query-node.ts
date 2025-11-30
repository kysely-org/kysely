import { freeze } from '../util/object-utils.js'
import { FromNode } from './from-node.js'
import type { JoinNode } from './join-node.js'
import type { OperationNode } from './operation-node.js'
import type { ReturningNode } from './returning-node.js'
import type { WhereNode } from './where-node.js'
import type { WithNode } from './with-node.js'
import type { LimitNode } from './limit-node.js'
import type { OrderByNode } from './order-by-node.js'
import type { OrderByItemNode } from './order-by-item-node.js'
import type { ExplainNode } from './explain-node.js'
import { UsingNode } from './using-node.js'
import type { TopNode } from './top-node.js'
import type { OutputNode } from './output-node.js'
import { QueryNode } from './query-node.js'

export interface DeleteQueryNode extends OperationNode {
  readonly kind: 'DeleteQueryNode'
  readonly from: FromNode
  readonly using?: UsingNode
  readonly joins?: ReadonlyArray<JoinNode>
  readonly where?: WhereNode
  readonly returning?: ReturningNode
  readonly with?: WithNode
  readonly orderBy?: OrderByNode
  readonly limit?: LimitNode
  readonly explain?: ExplainNode
  readonly endModifiers?: ReadonlyArray<OperationNode>
  readonly top?: TopNode
  readonly output?: OutputNode
}

type DeleteQueryNodeFactory = Readonly<{
  is(node: OperationNode): node is DeleteQueryNode
  create(
    fromItems: OperationNode[],
    withNode?: WithNode,
  ): Readonly<DeleteQueryNode>
  cloneWithOrderByItems(
    node: DeleteQueryNode,
    items: ReadonlyArray<OrderByItemNode>,
  ): Readonly<DeleteQueryNode>
  cloneWithoutOrderBy(node: DeleteQueryNode): Readonly<DeleteQueryNode>
  cloneWithLimit(
    deleteNode: DeleteQueryNode,
    limit: LimitNode,
  ): Readonly<DeleteQueryNode>
  cloneWithoutLimit(deleteNode: DeleteQueryNode): Readonly<DeleteQueryNode>
  cloneWithUsing(
    deleteNode: DeleteQueryNode,
    tables: OperationNode[],
  ): Readonly<DeleteQueryNode>
}>

/**
 * @internal
 */
export const DeleteQueryNode: DeleteQueryNodeFactory =
  freeze<DeleteQueryNodeFactory>({
    is(node): node is DeleteQueryNode {
      return node.kind === 'DeleteQueryNode'
    },

    create(fromItems, withNode?) {
      return freeze({
        kind: 'DeleteQueryNode',
        from: FromNode.create(fromItems),
        ...(withNode && { with: withNode }),
      })
    },

    // TODO: remove in v0.29
    /**
     * @deprecated Use `QueryNode.cloneWithoutOrderBy` instead.
     */
    cloneWithOrderByItems: (node, items) =>
      QueryNode.cloneWithOrderByItems(node, items),

    // TODO: remove in v0.29
    /**
     * @deprecated Use `QueryNode.cloneWithoutOrderBy` instead.
     */
    cloneWithoutOrderBy: (node) => QueryNode.cloneWithoutOrderBy(node),

    cloneWithLimit(deleteNode, limit) {
      return freeze({
        ...deleteNode,
        limit,
      })
    },

    cloneWithoutLimit(deleteNode) {
      return freeze({
        ...deleteNode,
        limit: undefined,
      })
    },

    cloneWithUsing(deleteNode, tables) {
      return freeze({
        ...deleteNode,
        using:
          deleteNode.using !== undefined
            ? UsingNode.cloneWithTables(deleteNode.using, tables)
            : UsingNode.create(tables),
      })
    },
  })
