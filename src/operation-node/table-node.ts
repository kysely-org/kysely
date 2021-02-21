import { freeze } from '../utils/object-utils'
import { createIdentifierNode, IdentifierNode } from './identifier-node'
import { OperationNode } from './operation-node'

export interface TableNode extends OperationNode {
  readonly kind: 'TableNode'
  readonly schema?: IdentifierNode
  readonly table: IdentifierNode
}

export function isTableNode(node: OperationNode): node is TableNode {
  return node.kind === 'TableNode'
}

export function createTableNode(table: string): TableNode {
  return {
    kind: 'TableNode',
    table: createIdentifierNode(table),
  }
}

export function createTableNodeWithSchema(
  schema: string,
  table: string
): TableNode {
  return freeze({
    kind: 'TableNode',
    schema: createIdentifierNode(schema),
    table: createIdentifierNode(table),
  })
}
