import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { AddColumnNode } from './add-column-node.js'
import { DropColumnNode } from './drop-column-node.js'
import { TableNode } from './table-node.js'
import { IdentifierNode } from './identifier-node.js'
import { RenameColumnNode } from './rename-column-node.js'
import { AlterColumnNode } from './alter-column-node.js'
import { AddConstraintNode } from './add-constraint-node.js'
import { DropConstraintNode } from './drop-constraint-node.js'
import { ModifyColumnNode } from './modify-column-node.js'

export type AlterTableNodeTableProps = Pick<
  AlterTableNode,
  'renameTo' | 'setSchema' | 'addConstraint' | 'dropConstraint'
>

export type AlterTableColumnAlterationNode =
  | RenameColumnNode
  | AddColumnNode
  | DropColumnNode
  | AlterColumnNode
  | ModifyColumnNode

export interface AlterTableNode extends OperationNode {
  readonly kind: 'AlterTableNode'
  readonly table: TableNode
  readonly renameTo?: TableNode
  readonly setSchema?: IdentifierNode
  readonly columnAlterations?: ReadonlyArray<AlterTableColumnAlterationNode>
  readonly addConstraint?: AddConstraintNode
  readonly dropConstraint?: DropConstraintNode
}

/**
 * @internal
 */
export const AlterTableNode = freeze({
  is(node: OperationNode): node is AlterTableNode {
    return node.kind === 'AlterTableNode'
  },

  create(table: string): AlterTableNode {
    return freeze({
      kind: 'AlterTableNode',
      table: TableNode.create(table),
    })
  },

  cloneWithTableProps(
    node: AlterTableNode,
    props: AlterTableNodeTableProps
  ): AlterTableNode {
    return freeze({
      ...node,
      ...props,
    })
  },

  cloneWithColumnAlteration(
    node: AlterTableNode,
    columnAlteration: AlterTableColumnAlterationNode
  ): AlterTableNode {
    return freeze({
      ...node,
      columnAlterations: node.columnAlterations
        ? [...node.columnAlterations, columnAlteration]
        : [columnAlteration],
    })
  },
})
