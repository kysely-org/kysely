import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'
import type { OperationNode } from './operation-node.js'

export interface SchemableIdentifierNode extends OperationNode {
  readonly kind: 'SchemableIdentifierNode'
  readonly schema?: IdentifierNode
  readonly identifier: IdentifierNode
}

type SchemableIdentifierNodeFactory = Readonly<{
  is(node: OperationNode): node is SchemableIdentifierNode
  create(identifier: string): Readonly<SchemableIdentifierNode>
  createWithSchema(
    schema: string,
    identifier: string,
  ): Readonly<SchemableIdentifierNode>
}>

/**
 * @internal
 */
export const SchemableIdentifierNode: SchemableIdentifierNodeFactory =
  freeze<SchemableIdentifierNodeFactory>({
    is(node): node is SchemableIdentifierNode {
      return node.kind === 'SchemableIdentifierNode'
    },

    create(identifier) {
      return freeze({
        kind: 'SchemableIdentifierNode',
        identifier: IdentifierNode.create(identifier),
      })
    },

    createWithSchema(schema, identifier) {
      return freeze({
        kind: 'SchemableIdentifierNode',
        schema: IdentifierNode.create(schema),
        identifier: IdentifierNode.create(identifier),
      })
    },
  })
