import { freeze } from '../util/object-utils'
import { IdentifierNode, identifierNode } from './identifier-node'
import { OperationNode } from './operation-node'

export interface ColumnNode extends OperationNode {
  readonly kind: 'ColumnNode'
  readonly column: IdentifierNode
}

export const columnNode = freeze({
  is(node: OperationNode): node is ColumnNode {
    return node.kind === 'ColumnNode'
  },

  create(column: string): ColumnNode {
    return freeze({
      kind: 'ColumnNode',
      column: identifierNode.create(column),
    })
  },
})
