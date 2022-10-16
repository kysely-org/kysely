import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { OperationNode } from './operation-node.js'

export interface ColumnUpdateNode extends OperationNode {
  readonly kind: 'ColumnUpdateNode'
  readonly column: ColumnNode
  readonly value: OperationNode
}

/**
 * @internal
 */
export const ColumnUpdateNode = freeze({
  is(node: OperationNode): node is ColumnUpdateNode {
    return node.kind === 'ColumnUpdateNode'
  },

  create(column: ColumnNode, value: OperationNode): ColumnUpdateNode {
    return freeze({
      kind: 'ColumnUpdateNode',
      column,
      value,
    })
  },
})
