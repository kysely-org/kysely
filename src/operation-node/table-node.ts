import { freeze } from '../util/object-utils'
import { IdentifierNode, identifierNode } from './identifier-node'
import { OperationNode } from './operation-node'

export interface TableNode extends OperationNode {
  readonly kind: 'TableNode'
  readonly schema?: IdentifierNode
  readonly table: IdentifierNode
}

/**
 * @internal
 */
export const tableNode = freeze({
  is(node: OperationNode): node is TableNode {
    return node.kind === 'TableNode'
  },

  create(table: string): TableNode {
    return {
      kind: 'TableNode',
      table: identifierNode.create(table),
    }
  },

  createWithSchema(schema: string, table: string): TableNode {
    return freeze({
      kind: 'TableNode',
      schema: identifierNode.create(schema),
      table: identifierNode.create(table),
    })
  },
})
