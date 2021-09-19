import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { columnNode, ColumnNode } from './column-node.js'

export interface RenameColumnNode extends OperationNode {
  readonly kind: 'RenameColumnNode'
  readonly column: ColumnNode
  readonly renameTo: ColumnNode
}

/**
 * @internal
 */
export const renameColumnNode = freeze({
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
