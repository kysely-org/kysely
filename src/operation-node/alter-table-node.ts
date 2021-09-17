import { OperationNode } from './operation-node'
import { freeze } from '../util/object-utils'
import { AddColumnNode } from './add-column-node'
import { DropColumnNode } from './drop-column-node'
import { tableNode, TableNode } from './table-node'
import { IdentifierNode } from './identifier-node'
import { RenameColumnNode } from './rename-column-node'
import { AlterColumnNode } from './alter-column-node'
import { AddConstraintNode } from './add-constraint-node'
import { DropConstraintNode } from './drop-constraint-node'

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
