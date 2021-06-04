import { freeze } from '../util/object-utils'
import { ColumnNode } from './column-node'
import { OperationNode } from './operation-node'
import { ValueExpressionNode } from './operation-node-utils'

export interface ColumnUpdateNode extends OperationNode {
  readonly kind: 'ColumnUpdateNode'
  readonly column: ColumnNode
  readonly value: ValueExpressionNode
}

export function isColumnUpdateNode(
  node: OperationNode
): node is ColumnUpdateNode {
  return node.kind === 'ColumnUpdateNode'
}

export function createColumnUpdateNode(
  column: ColumnNode,
  value: ValueExpressionNode
): ColumnUpdateNode {
  return freeze({
    kind: 'ColumnUpdateNode',
    column,
    value,
  })
}
