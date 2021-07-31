import { freeze } from '../util/object-utils'
import { FromNode, fromNode } from './from-node'
import { JoinNode } from './join-node'
import { OperationNode } from './operation-node'
import { TableExpressionNode } from './operation-node-utils'
import { ReturningNode } from './returning-node'
import { WhereNode } from './where-node'
import { WithNode } from './with-node'

export interface DeleteQueryNode extends OperationNode {
  readonly kind: 'DeleteQueryNode'
  readonly from: FromNode
  readonly joins?: ReadonlyArray<JoinNode>
  readonly where?: WhereNode
  readonly returning?: ReturningNode
  readonly with?: WithNode
}

export const deleteQueryNode = freeze({
  is(node: OperationNode): node is DeleteQueryNode {
    return node.kind === 'DeleteQueryNode'
  },

  create(fromItem: TableExpressionNode, withNode?: WithNode): DeleteQueryNode {
    return freeze({
      kind: 'DeleteQueryNode',
      from: fromNode.create([fromItem]),
      ...(withNode && { with: withNode }),
    })
  },
})
