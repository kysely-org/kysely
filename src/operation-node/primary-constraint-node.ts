import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'

export interface PrimaryKeyConstraintNode extends OperationNode {
  readonly kind: 'PrimaryKeyConstraintNode'
  readonly columns: ReadonlyArray<ColumnNode>
  readonly name?: IdentifierNode
  readonly deferrableModifier?: 'deferrable' | 'not deferrable'
  readonly initiallyModifier?: 'initially immediate' | 'initially deferred'
}

/**
 * @internal
 */
export const PrimaryConstraintNode = freeze({
  is(node: OperationNode): node is PrimaryKeyConstraintNode {
    return node.kind === 'PrimaryKeyConstraintNode'
  },

  create(columns: string[], constraintName?: string): PrimaryKeyConstraintNode {
    return freeze({
      kind: 'PrimaryKeyConstraintNode',
      columns: freeze(columns.map(ColumnNode.create)),
      name: constraintName ? IdentifierNode.create(constraintName) : undefined,
    })
  },
})
