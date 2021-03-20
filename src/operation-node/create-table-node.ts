import { freeze } from '../utils/object-utils'
import { ColumnDefinitionNode } from './column-definition-node'
import { OperationNode } from './operation-node'
import { TableNode } from './table-node'

export interface CreateTableNode extends OperationNode {
  readonly kind: 'CreateTableNode'
  readonly table: TableNode
  readonly columns: ReadonlyArray<ColumnDefinitionNode>
}

export function isCreateTableNode(
  node: OperationNode
): node is CreateTableNode {
  return node.kind === 'CreateTableNode'
}

export function createCreateTableNode(table: TableNode): CreateTableNode {
  return freeze({
    kind: 'CreateTableNode',
    table,
    columns: freeze([]),
  })
}

export function cloneCreateTableNodeWithColumn(
  node: CreateTableNode,
  column: ColumnDefinitionNode
): CreateTableNode {
  return freeze({
    ...node,
    columns: freeze([...node.columns, column]),
  })
}
