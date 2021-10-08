import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'

export interface UniqueConstraintNode extends OperationNode {
  readonly kind: 'UniqueConstraintNode'
  readonly columns: ReadonlyArray<ColumnNode>
  readonly name?: IdentifierNode
}

/**
 * @internal
 */
export const UniqueConstraintNode = freeze({
  is(node: OperationNode): node is UniqueConstraintNode {
    return node.kind === 'UniqueConstraintNode'
  },

  create(columns: string[], constraintName?: string): UniqueConstraintNode {
    return freeze({
      kind: 'UniqueConstraintNode',
      columns: freeze(columns.map(ColumnNode.create)),
      name: constraintName ? IdentifierNode.create(constraintName) : undefined,
    })
  },
})
