import { freeze } from '../util/object-utils'
import { OperationNode } from './operation-node'
import { createValueNode, ValueNode } from './value-node'

export interface LimitNode extends OperationNode {
  readonly kind: 'LimitNode'
  readonly limit: ValueNode
}

export function isLimitNode(node: OperationNode): node is LimitNode {
  return node.kind === 'LimitNode'
}

export function createLimitNode(limit: number): LimitNode {
  return freeze({
    kind: 'LimitNode',
    limit: createValueNode(limit),
  })
}
