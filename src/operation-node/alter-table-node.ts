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
import { DropIndexNode } from './drop-index-node.js'
import { AddIndexNode } from './add-index-node.js'
import { RenameConstraintNode } from './rename-constraint-node.js'

export type AlterTableNodeTableProps = Pick<
  AlterTableNode,
  | 'renameTo'
  | 'setSchema'
  | 'addConstraint'
  | 'dropConstraint'
  | 'addIndex'
  | 'dropIndex'
  | 'renameConstraint'
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
  readonly renameConstraint?: RenameConstraintNode
  readonly addIndex?: AddIndexNode
  readonly dropIndex?: DropIndexNode
}

type AlterTableNodeFactory = Readonly<{
  is(node: OperationNode): node is AlterTableNode
  create(table: TableNode): Readonly<AlterTableNode>
  cloneWithTableProps(
    node: AlterTableNode,
    props: AlterTableNodeTableProps,
  ): Readonly<AlterTableNode>
  cloneWithColumnAlteration(
    node: AlterTableNode,
    columnAlteration: AlterTableColumnAlterationNode,
  ): Readonly<AlterTableNode>
}>

/**
 * @internal
 */
export const AlterTableNode: AlterTableNodeFactory =
  freeze<AlterTableNodeFactory>({
    is(node): node is AlterTableNode {
      return node.kind === 'AlterTableNode'
    },

    create(table) {
      return freeze({
        kind: 'AlterTableNode',
        table,
      })
    },

    cloneWithTableProps(node, props) {
      return freeze({
        ...node,
        ...props,
      })
    },

    cloneWithColumnAlteration(node, columnAlteration) {
      return freeze({
        ...node,
        columnAlterations: node.columnAlterations
          ? [...node.columnAlterations, columnAlteration]
          : [columnAlteration],
      })
    },
  })
