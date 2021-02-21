import { freeze, PrimitiveValue } from '../utils/object-utils'
import { OperationNode } from './operation-node'

export interface ValueNode extends OperationNode {
  readonly kind: 'ValueNode'
  readonly value: PrimitiveValue
}

export function isValueNode(node: OperationNode): node is ValueNode {
  return node.kind === 'ValueNode'
}

export function createValueNode(value: PrimitiveValue): ValueNode {
  return freeze({
    kind: 'ValueNode',
    value,
  })
}
