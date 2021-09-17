import { freeze } from '../util/object-utils'
import { OperationNode } from './operation-node'

export interface IdentifierNode extends OperationNode {
  readonly kind: 'IdentifierNode'
  readonly identifier: string
}

/**
 * @internal
 */
export const identifierNode = freeze({
  is(node: OperationNode): node is IdentifierNode {
    return node.kind === 'IdentifierNode'
  },

  create(identifier: string): IdentifierNode {
    return freeze({
      kind: 'IdentifierNode',
      identifier,
    })
  },
})
