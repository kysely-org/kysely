import { freeze } from '../utils/object-utils'
import { OperationNode } from './operation-node'

export interface OperatorNode extends OperationNode {
  kind: 'OperatorNode'
  operator: string
}

export function isOperatorNode(node: OperationNode): node is OperatorNode {
  return node.kind === 'OperatorNode'
}

export function createOperatorNode(operator: string): OperatorNode {
  return freeze({
    kind: 'OperatorNode',
    operator,
  })
}
