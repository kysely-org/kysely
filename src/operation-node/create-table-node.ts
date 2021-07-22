import { freeze } from '../util/object-utils'
import { ColumnDefinitionNode } from './column-definition-node'
import { OperationNode } from './operation-node'
import { TableNode } from './table-node'

export type CreateTableNodeModifier = 'IfNotExists'

export interface CreateTableNode extends OperationNode {
  readonly kind: 'CreateTableNode'
  readonly table: TableNode
  readonly columns: ReadonlyArray<ColumnDefinitionNode>
  readonly modifier?: CreateTableNodeModifier
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
    createTable: CreateTableNode,
    column: ColumnDefinitionNode
  ): CreateTableNode {
    return freeze({
      ...createTable,
      columns: freeze([...createTable.columns, column]),
    })
  },

  cloneWithModifier(
    createTable: CreateTableNode,
    modifier: CreateTableNodeModifier
  ): CreateTableNode {
    return freeze({
      ...createTable,
      modifier,
    })
  },
})
