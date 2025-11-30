import type { OperationNode } from './operation-node.js'
import type { ColumnNode } from './column-node.js'
import type { TableNode } from './table-node.js'
import { SelectAllNode } from './select-all-node.js'
import { freeze } from '../util/object-utils.js'

export interface ReferenceNode extends OperationNode {
  readonly kind: 'ReferenceNode'
  readonly column: ColumnNode | SelectAllNode
  readonly table?: TableNode
}

type ReferenceNodeFactory = Readonly<{
  is(node: OperationNode): node is ReferenceNode
  create(column: ColumnNode, table?: TableNode): Readonly<ReferenceNode>
  createSelectAll(table: TableNode): Readonly<ReferenceNode>
}>

/**
 * @internal
 */
export const ReferenceNode: ReferenceNodeFactory = freeze<ReferenceNodeFactory>(
  {
    is(node): node is ReferenceNode {
      return node.kind === 'ReferenceNode'
    },

    create(column, table?) {
      return freeze({
        kind: 'ReferenceNode',
        table,
        column,
      })
    },

    createSelectAll(table) {
      return freeze({
        kind: 'ReferenceNode',
        table,
        column: SelectAllNode.create(),
      })
    },
  },
)
