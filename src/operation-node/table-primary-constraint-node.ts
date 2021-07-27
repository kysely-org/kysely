import { freeze } from '../util/object-utils'
import { columnNode, ColumnNode } from './column-node'
import { OperationNode } from './operation-node'

export interface TablePrimaryConstraintNode extends OperationNode {
  readonly kind: 'TablePrimaryConstraintNode'
  readonly columns: ReadonlyArray<ColumnNode>
}

export const tablePrimaryConstraintNode = freeze({
  is(node: OperationNode): node is TablePrimaryConstraintNode {
    return node.kind === 'TablePrimaryConstraintNode'
  },

  create(columns: string[]): TablePrimaryConstraintNode {
    return {
      kind: 'TablePrimaryConstraintNode',
      columns: columns.map(columnNode.create),
    }
  },
})
