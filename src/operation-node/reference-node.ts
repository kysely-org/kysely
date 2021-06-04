import { OperationNode } from './operation-node'
import { ColumnNode, createColumnNode } from './column-node'
import { createTableNode, TableNode } from './table-node'
import { createSelectAllNode, SelectAllNode } from './select-all-node'
import { freeze } from '../util/object-utils'

export interface ReferenceNode extends OperationNode {
  readonly kind: 'ReferenceNode'
  readonly table: TableNode
  readonly column: ColumnNode | SelectAllNode
}

export function isReferenceNode(node: OperationNode): node is ReferenceNode {
  return node.kind === 'ReferenceNode'
}

export function createReferenceNode(
  table: TableNode,
  column: ColumnNode
): ReferenceNode {
  return freeze({
    kind: 'ReferenceNode',
    table,
    column,
  })
}

export function createSelectAllReferenceNode(table: string): ReferenceNode {
  return freeze({
    kind: 'ReferenceNode',
    table: createTableNode(table),
    column: createSelectAllNode(),
  })
}
