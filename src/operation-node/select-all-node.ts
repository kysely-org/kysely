import { freeze } from '../utils/object-utils'
import { OperationNode } from './operation-node'

export interface SelectAllNode extends OperationNode {
  readonly kind: 'SelectAllNode'
}

export function isSelectAllNode(node: OperationNode): node is SelectAllNode {
  return node.kind === 'SelectAllNode'
}

export function createSelectAllNode(): SelectAllNode {
  return freeze({
    kind: 'SelectAllNode',
  })
}
