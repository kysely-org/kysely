import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { OperationNode } from './operation-node.js'
import { TableNode } from './table-node.js'

export interface CommonTableExpressionNameNode extends OperationNode {
  readonly kind: 'CommonTableExpressionNameNode'
  readonly table: TableNode
  readonly columns?: ReadonlyArray<ColumnNode>
}

/**
 * @internal
 */
export const CommonTableExpressionNameNode = freeze({
  is(node: OperationNode): node is CommonTableExpressionNameNode {
    return node.kind === 'CommonTableExpressionNameNode'
  },

  create(
    tableName: string,
    columnNames?: ReadonlyArray<string>
  ): CommonTableExpressionNameNode {
    return freeze({
      kind: 'CommonTableExpressionNameNode',
      table: TableNode.create(tableName),
      columns: columnNames
        ? freeze(columnNames.map(ColumnNode.create))
        : undefined,
    })
  },
})
