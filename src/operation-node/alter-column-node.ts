import { OperationNode } from './operation-node'
import { freeze } from '../util/object-utils'
import { columnNode, ColumnNode } from './column-node'

export interface AlterColumnNode extends OperationNode {
  readonly kind: 'AlterColumnNode'
  readonly column: ColumnNode
}

export const dropColumnNode = freeze({
  is(node: OperationNode): node is AlterColumnNode {
    return node.kind === 'AlterColumnNode'
  },

  create(column: string): AlterColumnNode {
    return freeze({
      kind: 'AlterColumnNode',
      column: columnNode.create(column),
    })
  },
})
