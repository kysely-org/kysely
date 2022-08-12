import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface IdentifierNode extends OperationNode {
  readonly kind: 'IdentifierNode'
  readonly name: string
}

/**
 * @internal
 */
export const IdentifierNode = freeze({
  is(node: OperationNode): node is IdentifierNode {
    return node.kind === 'IdentifierNode'
  },

  create(name: string): IdentifierNode {
    return freeze({
      kind: 'IdentifierNode',
      name,
    })
  },
})
