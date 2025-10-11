import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { OperationNode } from './operation-node.js'
import { TableNode } from './table-node.js'

export interface CommonTableExpressionNameNode extends OperationNode {
  readonly kind: 'CommonTableExpressionNameNode'
  readonly table: TableNode
  readonly columns?: ReadonlyArray<ColumnNode>
}

type CommonTableExpressionNameNodeFactory = Readonly<{
  is(node: OperationNode): node is CommonTableExpressionNameNode
  create(
    tableName: string,
    columnNames?: ReadonlyArray<string>,
  ): Readonly<CommonTableExpressionNameNode>
}>

/**
 * @internal
 */
export const CommonTableExpressionNameNode: CommonTableExpressionNameNodeFactory =
  freeze<CommonTableExpressionNameNodeFactory>({
    is(node): node is CommonTableExpressionNameNode {
      return node.kind === 'CommonTableExpressionNameNode'
    },

    create(tableName, columnNames?) {
      return freeze({
        kind: 'CommonTableExpressionNameNode',
        table: TableNode.create(tableName),
        columns: columnNames
          ? freeze(columnNames.map(ColumnNode.create))
          : undefined,
      })
    },
  })
