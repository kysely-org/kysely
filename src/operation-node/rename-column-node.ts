import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'

export interface RenameColumnNode extends OperationNode {
  readonly kind: 'RenameColumnNode'
  readonly column: ColumnNode
  readonly renameTo: ColumnNode
}

/**
 * @internal
 */
export const RenameColumnNode = freeze({
  is(node: OperationNode): node is RenameColumnNode {
    return node.kind === 'RenameColumnNode'
  },

  create(column: string, newColumn: string): RenameColumnNode {
    return freeze({
      kind: 'RenameColumnNode',
      column: ColumnNode.create(column),
      renameTo: ColumnNode.create(newColumn),
    })
  },
})
