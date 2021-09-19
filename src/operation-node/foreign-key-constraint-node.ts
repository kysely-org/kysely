import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { identifierNode, IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'
import { referencesNode, ReferencesNode } from './references-node.js'
import { TableNode } from './table-node.js'

export interface ForeignKeyConstraintNode extends OperationNode {
  readonly kind: 'ForeignKeyConstraintNode'
  readonly columns: ReadonlyArray<ColumnNode>
  readonly references: ReferencesNode
  readonly name?: IdentifierNode
}

/**
 * @internal
 */
export const foreignKeyConstraintNode = freeze({
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
      references: referencesNode.create(targetTable, targetColumns),
      name: constraintName ? identifierNode.create(constraintName) : undefined,
    })
  },
})
