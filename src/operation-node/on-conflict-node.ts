import { freeze } from '../util/object-utils'
import { ColumnNode } from './column-node'
import { ColumnUpdateNode } from './column-update-node'
import { OperationNode } from './operation-node'

export interface OnConflictNode extends OperationNode {
  readonly kind: 'OnConflictNode'
  readonly columns: ReadonlyArray<ColumnNode>
  readonly doNothing?: boolean
  readonly updates?: ReadonlyArray<ColumnUpdateNode>
}

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
