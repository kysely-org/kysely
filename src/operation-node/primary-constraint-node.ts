import { freeze } from '../util/object-utils'
import { columnNode, ColumnNode } from './column-node'
import { identifierNode, IdentifierNode } from './identifier-node'
import { OperationNode } from './operation-node'

export interface PrimaryKeyConstraintNode extends OperationNode {
  readonly kind: 'PrimaryKeyConstraintNode'
  readonly columns: ReadonlyArray<ColumnNode>
  readonly name?: IdentifierNode
}

/**
 * @internal
 */
export const primaryConstraintNode = freeze({
  is(node: OperationNode): node is PrimaryKeyConstraintNode {
    return node.kind === 'PrimaryKeyConstraintNode'
  },

  create(columns: string[], constraintName?: string): PrimaryKeyConstraintNode {
    return freeze({
      kind: 'PrimaryKeyConstraintNode',
      columns: freeze(columns.map(columnNode.create)),
      name: constraintName ? identifierNode.create(constraintName) : undefined,
    })
  },
})
