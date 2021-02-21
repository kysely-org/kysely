import { freeze } from '../utils/object-utils'
import { createIdentifierNode, IdentifierNode } from './identifier-node'
import { OperationNode } from './operation-node'

export interface ColumnNode extends OperationNode {
  readonly kind: 'ColumnNode'
  readonly column: IdentifierNode
}

export function isColumnNode(node: OperationNode): node is ColumnNode {
  return node.kind === 'ColumnNode'
}

export function createColumnNode(column: string): ColumnNode {
  return freeze({
    kind: 'ColumnNode',
    column: createIdentifierNode(column),
  })
}
