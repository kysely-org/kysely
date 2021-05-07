import { JoinNode } from './join-node'
import { OperationNode } from './operation-node'
import { ReturningNode } from './returning-node'
import { TableNode } from './table-node'
import { WhereNode } from './where-node'

export interface DeleteQueryNode extends OperationNode {
  readonly kind: 'DeleteQueryNode'
  readonly from: TableNode
  readonly joins?: ReadonlyArray<JoinNode>
  readonly where?: WhereNode
  readonly returning?: ReturningNode
}

export function isDeleteQueryNode(
  node: OperationNode
): node is DeleteQueryNode {
  return node.kind === 'DeleteQueryNode'
}

export function createDeleteQueryNodeWithTable(
  from: TableNode
): DeleteQueryNode {
  return {
    kind: 'DeleteQueryNode',
    from,
  }
}
