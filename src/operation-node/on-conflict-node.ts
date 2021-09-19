import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { ColumnUpdateNode } from './column-update-node.js'
import { OperationNode } from './operation-node.js'

export interface OnConflictNode extends OperationNode {
  readonly kind: 'OnConflictNode'
  readonly columns: ReadonlyArray<ColumnNode>
  readonly updates?: ReadonlyArray<ColumnUpdateNode>
  readonly doNothing?: boolean
}

/**
 * @internal
 */
export const onConflictNode = freeze({
  is(node: OperationNode): node is OnConflictNode {
    return node.kind === 'OnConflictNode'
  },

  createWithDoNothing(columns: ReadonlyArray<ColumnNode>): OnConflictNode {
    return freeze({
      kind: 'OnConflictNode',
      columns,
      doNothing: true,
    })
  },

  createWithUpdates(
    columns: ReadonlyArray<ColumnNode>,
    updates: ReadonlyArray<ColumnUpdateNode>
  ): OnConflictNode {
    return freeze({
      kind: 'OnConflictNode',
      columns,
      updates,
    })
  },
})
