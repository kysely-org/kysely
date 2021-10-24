import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'

export interface TableNode extends OperationNode {
  readonly kind: 'TableNode'
  readonly schema?: IdentifierNode
  readonly table: IdentifierNode
}

/**
 * @internal
 */
export const TableNode = freeze({
  is(node: OperationNode): node is TableNode {
    return node.kind === 'TableNode'
  },

  create(table: string): TableNode {
    return freeze({
      kind: 'TableNode',
      table: IdentifierNode.create(table),
    })
  },

  createWithSchema(schema: string, table: string): TableNode {
    return freeze({
      kind: 'TableNode',
      schema: IdentifierNode.create(schema),
      table: IdentifierNode.create(table),
    })
  },
})
