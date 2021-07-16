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

export function isOnConflictNode(node: OperationNode): node is OnConflictNode {
  return node.kind === 'OnConflictNode'
}

export function createOnConflictNodeWithDoNothing(
  columns: ReadonlyArray<ColumnNode>
): OnConflictNode {
  return freeze({
    kind: 'OnConflictNode',
    columns,
    doNothing: true,
  })
}

export function createOnConflictNodeWithUpdates(
  columns: ReadonlyArray<ColumnNode>,
  updates: ReadonlyArray<ColumnUpdateNode>
): OnConflictNode {
  return freeze({
    kind: 'OnConflictNode',
    columns,
    updates,
  })
}
