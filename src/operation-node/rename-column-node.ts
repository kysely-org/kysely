import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'

export interface RenameColumnNode extends OperationNode {
  readonly kind: 'RenameColumnNode'
  readonly column: ColumnNode
  readonly renameTo: ColumnNode
}

type RenameColumnNodeFactory = Readonly<{
  is(node: OperationNode): node is RenameColumnNode
  create(column: string, newColumn: string): Readonly<RenameColumnNode>
}>

/**
 * @internal
 */
export const RenameColumnNode: RenameColumnNodeFactory =
  freeze<RenameColumnNodeFactory>({
    is(node): node is RenameColumnNode {
      return node.kind === 'RenameColumnNode'
    },

    create(column, newColumn) {
      return freeze({
        kind: 'RenameColumnNode',
        column: ColumnNode.create(column),
        renameTo: ColumnNode.create(newColumn),
      })
    },
  })
