import { freeze } from '../util/object-utils'
import { columnNode, ColumnNode } from './column-node'
import { identifierNode, IdentifierNode } from './identifier-node'
import { OperationNode } from './operation-node'

export interface UniqueConstraintNode extends OperationNode {
  readonly kind: 'UniqueConstraintNode'
  readonly columns: ReadonlyArray<ColumnNode>
  readonly name?: IdentifierNode
}

export const uniqueConstraintNode = freeze({
  is(node: OperationNode): node is UniqueConstraintNode {
    return node.kind === 'UniqueConstraintNode'
  },

  create(columns: string[], constraintName?: string): UniqueConstraintNode {
    return freeze({
      kind: 'UniqueConstraintNode',
      columns: freeze(columns.map(columnNode.create)),
      name: constraintName ? identifierNode.create(constraintName) : undefined,
    })
  },
})
