import { AndNode } from './and-node'
import { OperationNode } from './operation-node'
import { OrNode } from './or-node'
import { FilterNode } from './filter-node'
import { freeze } from '../utils/object-utils'

type ParensNodeChild = FilterNode | AndNode | OrNode | ParensNode

export interface ParensNode extends OperationNode {
  readonly kind: 'ParensNode'
  readonly node: ParensNodeChild
}

export function isParensNode(node: OperationNode): node is ParensNode {
  return node.kind === 'ParensNode'
}

export function createParensNode(node: ParensNodeChild): ParensNode {
  return freeze({
    kind: 'ParensNode',
    node,
  })
}
