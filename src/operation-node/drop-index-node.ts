import { freeze } from '../util/object-utils'
import { createIdentifierNode, IdentifierNode } from './identifier-node'
import { OperationNode } from './operation-node'

export type DropIndexNodeModifier = 'IfExists'

export interface DropIndexNode extends OperationNode {
  readonly kind: 'DropIndexNode'
  readonly name: IdentifierNode
  readonly modifier?: DropIndexNodeModifier
}

export function isDropIndexNode(node: OperationNode): node is DropIndexNode {
  return node.kind === 'DropIndexNode'
}

export function createDropIndexNode(
  name: string,
  params?: { modifier?: DropIndexNodeModifier }
): DropIndexNode {
  return freeze({
    kind: 'DropIndexNode',
    name: createIdentifierNode(name),
    ...params,
  })
}
