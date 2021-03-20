import { OperationNode } from './operation-node'
import { TableNode } from './table-node'

export interface DeleteNode extends OperationNode {
  readonly kind: 'DeleteNode'
  readonly from: TableNode
}

export function isDeleteNodeNode(node: OperationNode): node is DeleteNode {
  return node.kind === 'DeleteNode'
}

export function createDeleteNodeWithTable(from: TableNode): DeleteNode {
  return {
    kind: 'DeleteNode',
    from,
  }
}
