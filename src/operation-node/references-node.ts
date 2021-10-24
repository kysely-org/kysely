import { OperationNode } from './operation-node.js'
import { ColumnNode } from './column-node.js'
import { TableNode } from './table-node.js'
import { freeze } from '../util/object-utils.js'

export type OnModifyForeignAction =
  | 'no action'
  | 'restrict'
  | 'cascade'
  | 'set null'
  | 'set default'

export interface ReferencesNode extends OperationNode {
  readonly kind: 'ReferencesNode'
  readonly table: TableNode
  readonly columns: ReadonlyArray<ColumnNode>
  readonly onDelete?: OnModifyForeignAction
  readonly onUpdate?: OnModifyForeignAction
}

/**
 * @internal
 */
export const ReferencesNode = freeze({
  is(node: OperationNode): node is ReferencesNode {
    return node.kind === 'ReferencesNode'
  },

  create(table: TableNode, columns: ReadonlyArray<ColumnNode>): ReferencesNode {
    return freeze({
      kind: 'ReferencesNode',
      table,
      columns: freeze([...columns]),
    })
  },

  cloneWithOnDelete(
    references: ReferencesNode,
    onDelete: OnModifyForeignAction
  ): ReferencesNode {
    return freeze({
      ...references,
      onDelete,
    })
  },

  cloneWithOnUpdate(
    references: ReferencesNode,
    onUpdate: OnModifyForeignAction
  ): ReferencesNode {
    return freeze({
      ...references,
      onUpdate,
    })
  },
})
