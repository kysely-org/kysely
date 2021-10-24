import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'
import { OnModifyForeignAction, ReferencesNode } from './references-node.js'
import { TableNode } from './table-node.js'

export type ForeignKeyConstraintNodeProps = Omit<
  ForeignKeyConstraintNode,
  'kind' | 'columns' | 'references'
>

export interface ForeignKeyConstraintNode extends OperationNode {
  readonly kind: 'ForeignKeyConstraintNode'
  readonly columns: ReadonlyArray<ColumnNode>
  readonly references: ReferencesNode
  readonly onDelete?: OnModifyForeignAction
  readonly onUpdate?: OnModifyForeignAction
  readonly name?: IdentifierNode
}

/**
 * @internal
 */
export const ForeignKeyConstraintNode = freeze({
  is(node: OperationNode): node is ForeignKeyConstraintNode {
    return node.kind === 'ForeignKeyConstraintNode'
  },

  create(
    sourceColumns: ReadonlyArray<ColumnNode>,
    targetTable: TableNode,
    targetColumns: ReadonlyArray<ColumnNode>,
    constraintName?: string
  ): ForeignKeyConstraintNode {
    return freeze({
      kind: 'ForeignKeyConstraintNode',
      columns: sourceColumns,
      references: ReferencesNode.create(targetTable, targetColumns),
      name: constraintName ? IdentifierNode.create(constraintName) : undefined,
    })
  },

  cloneWith(
    node: ForeignKeyConstraintNode,
    props: ForeignKeyConstraintNodeProps
  ) {
    return freeze({
      ...node,
      ...props,
    })
  },
})
