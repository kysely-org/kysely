import { freeze } from '../utils/object-utils'
import { OperationNode } from './operation-node'

export interface IdentifierNode extends OperationNode {
  readonly kind: 'IdentifierNode'
  readonly identifier: string
}

export function isIdentifierNode(node: OperationNode): node is IdentifierNode {
  return node.kind === 'IdentifierNode'
}

export function createIdentifierNode(identifier: string): IdentifierNode {
  return freeze({
    kind: 'IdentifierNode',
    identifier,
  })
}
