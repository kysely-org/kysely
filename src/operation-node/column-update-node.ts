import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { OperationNode } from './operation-node.js'
import { ValueExpressionNode } from './operation-node-utils.js'

export interface ColumnUpdateNode extends OperationNode {
  readonly kind: 'ColumnUpdateNode'
  readonly column: ColumnNode
  readonly value: ValueExpressionNode
}

/**
 * @internal
 */
export const columnUpdateNode = freeze({
  is(node: OperationNode): node is ColumnUpdateNode {
    return node.kind === 'ColumnUpdateNode'
  },

  create(column: ColumnNode, value: ValueExpressionNode): ColumnUpdateNode {
    return freeze({
      kind: 'ColumnUpdateNode',
      column,
      value,
    })
  },
})
