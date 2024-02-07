import { freeze } from '../util/object-utils.js'
import { FromNode } from './from-node.js'
import { JoinNode } from './join-node.js'
import { OperationNode } from './operation-node.js'
import { ReturningNode } from './returning-node.js'
import { WhereNode } from './where-node.js'
import { WithNode } from './with-node.js'
import { LimitNode } from './limit-node.js'
import { OrderByNode } from './order-by-node.js'
import { OrderByItemNode } from './order-by-item-node.js'
import { ExplainNode } from './explain-node.js'
import { UsingNode } from './using-node.js'
import {DeleteModifierNode} from './delete-modifier-node.js'

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
  readonly frontModifiers?: ReadonlyArray<DeleteModifierNode>
  readonly endModifiers?: ReadonlyArray<DeleteModifierNode>
}

/**
 * @internal
 */
export const DeleteQueryNode = freeze({
  is(node: OperationNode): node is DeleteQueryNode {
    return node.kind === 'DeleteQueryNode'
  },

  create(fromItems: OperationNode[], withNode?: WithNode): DeleteQueryNode {
    return freeze({
      kind: 'DeleteQueryNode',
      from: FromNode.create(fromItems),
      ...(withNode && { with: withNode }),
    })
  },

  cloneWithFrontModifier(
    deleteQuery: DeleteQueryNode,
    modifier: DeleteModifierNode,
  ): DeleteQueryNode {
    return freeze({
      ...deleteQuery,
      frontModifiers: deleteQuery.frontModifiers
        ? freeze([...deleteQuery.frontModifiers, modifier])
        : freeze([modifier]),
    })
  },

  cloneWithEndModifier(
    deleteQuery: DeleteQueryNode,
    modifier: DeleteModifierNode,
  ): DeleteQueryNode {
    return freeze({
      ...deleteQuery,
      endModifiers: deleteQuery.endModifiers
        ? freeze([...deleteQuery.endModifiers, modifier])
        : freeze([modifier]),
    })
  },

  cloneWithOrderByItems(
    deleteNode: DeleteQueryNode,
    items: ReadonlyArray<OrderByItemNode>,
  ): DeleteQueryNode {
    return freeze({
      ...deleteNode,
      orderBy: deleteNode.orderBy
        ? OrderByNode.cloneWithItems(deleteNode.orderBy, items)
        : OrderByNode.create(items),
    })
  },

  cloneWithoutOrderBy(deleteNode: DeleteQueryNode): DeleteQueryNode {
    return freeze({
      ...deleteNode,
      orderBy: undefined,
    })
  },

  cloneWithLimit(
    deleteNode: DeleteQueryNode,
    limit: LimitNode,
  ): DeleteQueryNode {
    return freeze({
      ...deleteNode,
      limit,
    })
  },

  cloneWithoutLimit(deleteNode: DeleteQueryNode): DeleteQueryNode {
    return freeze({
      ...deleteNode,
      limit: undefined,
    })
  },

  cloneWithUsing(
    deleteNode: DeleteQueryNode,
    tables: OperationNode[],
  ): DeleteQueryNode {
    return freeze({
      ...deleteNode,
      using:
        deleteNode.using !== undefined
          ? UsingNode.cloneWithTables(deleteNode.using, tables)
          : UsingNode.create(tables),
    })
  },

  createWithExpression(modifier: OperationNode): DeleteModifierNode {
    return freeze({
      kind: 'DeleteModifierNode',
      rawModifier: modifier,
    })
  },
})
