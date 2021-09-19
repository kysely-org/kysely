import { OperationNode } from './operation-node.js'
import { ColumnNode } from './column-node.js'
import { TableNode } from './table-node.js'
import { freeze } from '../util/object-utils.js'

export type OnDelete = 'cascade' | 'set null'

export interface ReferencesNode extends OperationNode {
  readonly kind: 'ReferencesNode'
  readonly table: TableNode
  readonly columns: ReadonlyArray<ColumnNode>
  readonly onDelete?: OnDelete
}

/**
 * @internal
 */
export const referencesNode = freeze({
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
    onDelete: OnDelete
  ): ReferencesNode {
    return freeze({
      ...references,
      onDelete,
    })
  },
})
