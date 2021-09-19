import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { AddColumnNode } from './add-column-node.js'
import { DropColumnNode } from './drop-column-node.js'
import { tableNode, TableNode } from './table-node.js'
import { IdentifierNode } from './identifier-node.js'
import { RenameColumnNode } from './rename-column-node.js'
import { AlterColumnNode } from './alter-column-node.js'
import { AddConstraintNode } from './add-constraint-node.js'
import { DropConstraintNode } from './drop-constraint-node.js'

export type AlterTableNodeParams = Omit<
  Partial<AlterTableNode>,
  'kind' | 'table'
>

export interface AlterTableNode extends OperationNode {
  readonly kind: 'AlterTableNode'
  readonly table: TableNode
  readonly renameTo?: TableNode
  readonly setSchema?: IdentifierNode
  readonly renameColumn?: RenameColumnNode
  readonly addColumn?: AddColumnNode
  readonly dropColumn?: DropColumnNode
  readonly alterColumn?: AlterColumnNode
  readonly addConstraint?: AddConstraintNode
  readonly dropConstraint?: DropConstraintNode
}

/**
 * @internal
 */
export const alterTableNode = freeze({
  is(node: OperationNode): node is AlterTableNode {
    return node.kind === 'AlterTableNode'
  },

  create(table: string): AlterTableNode {
    return freeze({
      kind: 'AlterTableNode',
      table: tableNode.create(table),
    })
  },

  cloneWith(
    node: AlterTableNode,
    params: AlterTableNodeParams
  ): AlterTableNode {
    return freeze({
      ...node,
      ...params,
    })
  },
})
