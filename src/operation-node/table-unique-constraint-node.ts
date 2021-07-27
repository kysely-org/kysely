import { freeze } from '../util/object-utils'
import { columnNode, ColumnNode } from './column-node'
import { OperationNode } from './operation-node'

export interface TableUniqueConstraintNode extends OperationNode {
  readonly kind: 'TableUniqueConstraintNode'
  readonly columns: ReadonlyArray<ColumnNode>
}

export const tableUniqueConstraintNode = freeze({
  is(node: OperationNode): node is TableUniqueConstraintNode {
    return node.kind === 'TableUniqueConstraintNode'
  },

  create(columns: string[]): TableUniqueConstraintNode {
    return {
      kind: 'TableUniqueConstraintNode',
      columns: columns.map(columnNode.create),
    }
  },
})
