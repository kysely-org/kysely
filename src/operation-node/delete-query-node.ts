import { freeze } from '../util/object-utils.js'
import { FromNode, fromNode } from './from-node.js'
import { JoinNode } from './join-node.js'
import { OperationNode } from './operation-node.js'
import { TableExpressionNode } from './operation-node-utils.js'
import { ReturningNode } from './returning-node.js'
import { WhereNode } from './where-node.js'
import { WithNode } from './with-node.js'

export interface DeleteQueryNode extends OperationNode {
  readonly kind: 'DeleteQueryNode'
  readonly from: FromNode
  readonly joins?: ReadonlyArray<JoinNode>
  readonly where?: WhereNode
  readonly returning?: ReturningNode
  readonly with?: WithNode
}

/**
 * @internal
 */
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
