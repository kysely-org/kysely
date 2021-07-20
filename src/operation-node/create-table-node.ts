import { freeze } from '../util/object-utils'
import { ColumnDefinitionNode } from './column-definition-node'
import { OperationNode } from './operation-node'
import { TableNode } from './table-node'

export interface CreateTableNode extends OperationNode {
  readonly kind: 'CreateTableNode'
  readonly table: TableNode
  readonly columns: ReadonlyArray<ColumnDefinitionNode>
}

export const createTableNode = freeze({
  is(node: OperationNode): node is CreateTableNode {
    return node.kind === 'CreateTableNode'
  },

  create(table: TableNode): CreateTableNode {
    return freeze({
      kind: 'CreateTableNode',
      table,
      columns: freeze([]),
    })
  },

  cloneWithColumn(
    node: CreateTableNode,
    column: ColumnDefinitionNode
  ): CreateTableNode {
    return freeze({
      ...node,
      columns: freeze([...node.columns, column]),
    })
  },
})
