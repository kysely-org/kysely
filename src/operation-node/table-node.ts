import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'
import { SchemableIdentifierNode } from './schemable-identifier-node.js'

export interface TableNode extends OperationNode {
  readonly kind: 'TableNode'
  readonly table: SchemableIdentifierNode
}

type TableNodeFactory = Readonly<{
  is(node: OperationNode): node is TableNode
  create(table: string): Readonly<TableNode>
  createWithSchema(schema: string, table: string): Readonly<TableNode>
}>

/**
 * @internal
 */
export const TableNode: TableNodeFactory = freeze<TableNodeFactory>({
  is(node): node is TableNode {
    return node.kind === 'TableNode'
  },

  create(table) {
    return freeze({
      kind: 'TableNode',
      table: SchemableIdentifierNode.create(table),
    })
  },

  createWithSchema(schema, table) {
    return freeze({
      kind: 'TableNode',
      table: SchemableIdentifierNode.createWithSchema(schema, table),
    })
  },
})
