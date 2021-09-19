import { freeze } from '../util/object-utils.js'
import { IdentifierNode, identifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'

export type DropIndexNodeParams = Omit<Partial<DropIndexNode>, 'kind' | 'name'>
export type DropIndexNodeModifier = 'IfExists'

export interface DropIndexNode extends OperationNode {
  readonly kind: 'DropIndexNode'
  readonly name: IdentifierNode
  readonly modifier?: DropIndexNodeModifier
}

/**
 * @internal
 */
export const dropIndexNode = freeze({
  is(node: OperationNode): node is DropIndexNode {
    return node.kind === 'DropIndexNode'
  },

  create(name: string, params?: DropIndexNodeParams): DropIndexNode {
    return freeze({
      kind: 'DropIndexNode',
      name: identifierNode.create(name),
      ...params,
    })
  },

  cloneWithModifier(
    dropIndex: DropIndexNode,
    modifier: DropIndexNodeModifier
  ): DropIndexNode {
    return freeze({
      ...dropIndex,
      modifier,
    })
  },
})
