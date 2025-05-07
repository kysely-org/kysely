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
  readonly deferrable?: boolean
  readonly initiallyDeferred?: boolean
}

type ForeignKeyConstraintNodeFactory = Readonly<{
  is(node: OperationNode): node is ForeignKeyConstraintNode
  create(
    sourceColumns: ReadonlyArray<ColumnNode>,
    targetTable: TableNode,
    targetColumns: ReadonlyArray<ColumnNode>,
    constraintName?: string,
  ): Readonly<ForeignKeyConstraintNode>
  cloneWith(
    node: ForeignKeyConstraintNode,
    props: ForeignKeyConstraintNodeProps,
  ): Readonly<ForeignKeyConstraintNode>
}>

/**
 * @internal
 */
export const ForeignKeyConstraintNode: ForeignKeyConstraintNodeFactory =
  freeze<ForeignKeyConstraintNodeFactory>({
    is(node): node is ForeignKeyConstraintNode {
      return node.kind === 'ForeignKeyConstraintNode'
    },

    create(sourceColumns, targetTable, targetColumns, constraintName?) {
      return freeze({
        kind: 'ForeignKeyConstraintNode',
        columns: sourceColumns,
        references: ReferencesNode.create(targetTable, targetColumns),
        name: constraintName
          ? IdentifierNode.create(constraintName)
          : undefined,
      })
    },

    cloneWith(node, props) {
      return freeze({
        ...node,
        ...props,
      })
    },
  })
