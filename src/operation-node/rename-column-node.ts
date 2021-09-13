import { OperationNode } from './operation-node'
import { freeze } from '../util/object-utils'
import { columnNode, ColumnNode } from './column-node'

export interface RenameColumnNode extends OperationNode {
  readonly kind: 'RenameColumnNode'
  readonly column: ColumnNode
  readonly renameTo: ColumnNode
}

export const dropColumnNode = freeze({
  is(node: OperationNode): node is RenameColumnNode {
    return node.kind === 'RenameColumnNode'
  },

  create(column: string, newColumn: string): RenameColumnNode {
    return freeze({
      kind: 'RenameColumnNode',
      column: columnNode.create(column),
      renameTo: columnNode.create(newColumn),
    })
  },
})
