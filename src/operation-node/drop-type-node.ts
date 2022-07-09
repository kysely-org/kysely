import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'

export type DropTypeNodeParams = Omit<Partial<DropTypeNode>, 'kind' | 'name'>

export interface DropTypeNode extends OperationNode {
  readonly kind: 'DropTypeNode'
  readonly name: IdentifierNode
  readonly ifExists?: boolean
}

/**
 * @internal
 */
export const DropTypeNode = freeze({
  is(node: OperationNode): node is DropTypeNode {
    return node.kind === 'DropTypeNode'
  },

  create(name: string): DropTypeNode {
    return freeze({
      kind: 'DropTypeNode',
      name: IdentifierNode.create(name),
    })
  },

  cloneWith(dropType: DropTypeNode, params: DropTypeNodeParams): DropTypeNode {
    return freeze({
      ...dropType,
      ...params,
    })
  },
})
