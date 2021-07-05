import { freeze } from '../util/object-utils'
import { OperationNode } from './operation-node'
import { createValueNode, ValueNode } from './value-node'

export interface OffsetNode extends OperationNode {
  readonly kind: 'OffsetNode'
  readonly offset: ValueNode
}

export function isOffsetNode(node: OperationNode): node is OffsetNode {
  return node.kind === 'OffsetNode'
}

export function createOffsetNode(offset: number): OffsetNode {
  return freeze({
    kind: 'OffsetNode',
    offset: createValueNode(offset),
  })
}
