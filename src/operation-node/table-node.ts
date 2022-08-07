import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { SchemableIdentifierNode } from './schemable-identifier-node.js'

export interface TableNode extends OperationNode {
  readonly kind: 'TableNode'
  readonly table: SchemableIdentifierNode
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
      table: SchemableIdentifierNode.create(table),
    })
  },

  createWithSchema(schema: string, table: string): TableNode {
    return freeze({
      kind: 'TableNode',
      table: SchemableIdentifierNode.createWithSchema(schema, table),
    })
  },
})
