import { freeze } from '../util/object-utils.js'
import { FromNode } from './from-node.js'
import { JoinNode } from './join-node.js'
import { OperationNode } from './operation-node.js'
import { TableExpressionNode } from './operation-node-utils.js'
import { ReturningNode } from './returning-node.js'
import { WhereNode } from './where-node.js'
import { WithNode } from './with-node.js'
import { LimitNode } from './limit-node.js'
import { OrderByNode } from './order-by-node.js'
import { OrderByItemNode } from './order-by-item-node.js'
import { ExplainNode } from './explain-node.js'

export interface DeleteQueryNode extends OperationNode {
  readonly kind: 'DeleteQueryNode'
  readonly from: FromNode
  readonly joins?: ReadonlyArray<JoinNode>
  readonly where?: WhereNode
  readonly returning?: ReturningNode
  readonly with?: WithNode
  readonly orderBy?: OrderByNode
  readonly limit?: LimitNode
  readonly explain?: ExplainNode
}

/**
 * @internal
 */
export const DeleteQueryNode = freeze({
  is(node: OperationNode): node is DeleteQueryNode {
    return node.kind === 'DeleteQueryNode'
  },

  create(fromItem: TableExpressionNode, withNode?: WithNode): DeleteQueryNode {
    return freeze({
      kind: 'DeleteQueryNode',
      from: FromNode.create([fromItem]),
      ...(withNode && { with: withNode }),
    })
  },

  cloneWithOrderByItem(
    deleteNode: DeleteQueryNode,
    item: OrderByItemNode
  ): DeleteQueryNode {
    return freeze({
      ...deleteNode,
      orderBy: deleteNode.orderBy
        ? OrderByNode.cloneWithItem(deleteNode.orderBy, item)
        : OrderByNode.create(item),
    })
  },

  cloneWithLimit(
    deleteNode: DeleteQueryNode,
    limit: LimitNode
  ): DeleteQueryNode {
    return freeze({
      ...deleteNode,
      limit,
    })
  },

  cloneWithExplain(
    deleteNode: DeleteQueryNode,
    explain: ExplainNode
  ): DeleteQueryNode {
    return freeze({
      ...deleteNode,
      explain,
    })
  },
})
