import { freeze } from '../utils/object-utils'
import { AndNodeChildNode } from './and-node'
import { OperationNode } from './operation-node'

type OrNodeChildNode = AndNodeChildNode

export interface OrNode extends OperationNode {
  readonly kind: 'OrNode'
  readonly left: OrNodeChildNode
  readonly right: OrNodeChildNode
}

export function isOrNode(node: OperationNode): node is OrNode {
  return node.kind === 'OrNode'
}

export function createOrNode(
  left: OrNodeChildNode,
  right: OrNodeChildNode
): OrNode {
  return freeze({
    kind: 'OrNode',
    left,
    right,
  })
}
