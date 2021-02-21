import { freeze } from '../utils/object-utils'
import { AndNodeChildNode } from './and-node'
import { OperationNode } from './operation-node'

type OrNodeChildNode = AndNodeChildNode

export interface OrNode extends OperationNode {
  readonly kind: 'OrNode'
  readonly lhs: OrNodeChildNode
  readonly rhs: OrNodeChildNode
}

export function isOrNode(node: OperationNode): node is OrNode {
  return node.kind === 'OrNode'
}

export function createOrNode(
  lhs: OrNodeChildNode,
  rhs: OrNodeChildNode
): OrNode {
  return freeze({
    kind: 'OrNode',
    lhs,
    rhs,
  })
}
