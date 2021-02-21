import { OperationNode } from './operation-node'
import { OrNode } from './or-node'
import { ParensNode } from './parens-node'
import { FilterNode } from './filter-node'
import { freeze } from '../utils/object-utils'

export type AndNodeChildNode = FilterNode | AndNode | OrNode | ParensNode

export interface AndNode extends OperationNode {
  readonly kind: 'AndNode'
  readonly lhs: AndNodeChildNode
  readonly rhs: AndNodeChildNode
}

export function isAndNode(node: OperationNode): node is AndNode {
  return node.kind === 'AndNode'
}

export function createAndNode(
  lhs: AndNodeChildNode,
  rhs: AndNodeChildNode
): AndNode {
  return freeze({
    kind: 'AndNode',
    lhs,
    rhs,
  })
}
