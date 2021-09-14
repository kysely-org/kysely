import { freeze } from '../util/object-utils'
import { ColumnNode } from './column-node'
import { identifierNode, IdentifierNode } from './identifier-node'
import { OperationNode } from './operation-node'
import { referencesNode, ReferencesNode } from './references-node'
import { TableNode } from './table-node'

export interface ForeignKeyConstraintNode extends OperationNode {
  readonly kind: 'ForeignKeyConstraintNode'
  readonly references: ReferencesNode
  readonly name?: IdentifierNode
}

export const foreignKeyConstraintNode = freeze({
  is(node: OperationNode): node is ForeignKeyConstraintNode {
    return node.kind === 'ForeignKeyConstraintNode'
  },

  create(
    table: TableNode,
    column: ColumnNode,
    constraintName?: string
  ): ForeignKeyConstraintNode {
    return freeze({
      kind: 'ForeignKeyConstraintNode',
      references: referencesNode.create(table, column),
      name: constraintName ? identifierNode.create(constraintName) : undefined,
    })
  },
})
