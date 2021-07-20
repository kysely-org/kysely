import { OperationNode } from './operation-node'
import { ColumnNode } from './column-node'
import { tableNode, TableNode } from './table-node'
import { selectAllNode, SelectAllNode } from './select-all-node'
import { freeze } from '../util/object-utils'

export interface ReferenceNode extends OperationNode {
  readonly kind: 'ReferenceNode'
  readonly table: TableNode
  readonly column: ColumnNode | SelectAllNode
}

export const referenceNode = freeze({
  is(node: OperationNode): node is ReferenceNode {
    return node.kind === 'ReferenceNode'
  },

  create(table: TableNode, column: ColumnNode): ReferenceNode {
    return freeze({
      kind: 'ReferenceNode',
      table,
      column,
    })
  },

  createSelectAll(table: string): ReferenceNode {
    return freeze({
      kind: 'ReferenceNode',
      table: tableNode.create(table),
      column: selectAllNode.create(),
    })
  },
})
