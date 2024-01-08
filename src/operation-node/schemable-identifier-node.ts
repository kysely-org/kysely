import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'

export interface SchemableIdentifierNode extends OperationNode {
  readonly kind: 'SchemableIdentifierNode'
  readonly schema?: IdentifierNode
  readonly identifier: IdentifierNode
}

/**
 * @internal
 */
export const SchemableIdentifierNode = freeze({
  is(node: OperationNode): node is SchemableIdentifierNode {
    return node.kind === 'SchemableIdentifierNode'
  },

  create(identifier: string): SchemableIdentifierNode {
    return freeze({
      kind: 'SchemableIdentifierNode',
      identifier: IdentifierNode.create(identifier),
    })
  },

  createWithSchema(
    schema: string,
    identifier: string,
  ): SchemableIdentifierNode {
    return freeze({
      kind: 'SchemableIdentifierNode',
      schema: IdentifierNode.create(schema),
      identifier: IdentifierNode.create(identifier),
    })
  },
})
