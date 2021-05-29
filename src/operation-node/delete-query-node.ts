import { freeze } from '../utils/object-utils'
import { createFromNodeWithItems, FromNode } from './from-node'
import { JoinNode } from './join-node'
import { OperationNode } from './operation-node'
import { TableExpressionNode } from './operation-node-utils'
import { ReturningNode } from './returning-node'
import { WhereNode } from './where-node'

export interface DeleteQueryNode extends OperationNode {
  readonly kind: 'DeleteQueryNode'
  readonly from: FromNode
  readonly joins?: ReadonlyArray<JoinNode>
  readonly where?: WhereNode
  readonly returning?: ReturningNode
}

export function isDeleteQueryNode(
  node: OperationNode
): node is DeleteQueryNode {
  return node.kind === 'DeleteQueryNode'
}

export function createDeleteQueryNodeWithFromItem(
  fromItem: TableExpressionNode
): DeleteQueryNode {
  return freeze({
    kind: 'DeleteQueryNode',
    from: createFromNodeWithItems([fromItem]),
  })
}
