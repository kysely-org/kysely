import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { columnNode, ColumnNode } from './column-node.js'

export interface DropColumnNode extends OperationNode {
  readonly kind: 'DropColumnNode'
  readonly column: ColumnNode
}

/**
 * @internal
 */
export const dropColumnNode = freeze({
  is(node: OperationNode): node is DropColumnNode {
    return node.kind === 'DropColumnNode'
  },

  create(column: string): DropColumnNode {
    return freeze({
      kind: 'DropColumnNode',
      column: columnNode.create(column),
    })
  },
})
