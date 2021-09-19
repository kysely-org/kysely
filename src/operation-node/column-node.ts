import { freeze } from '../util/object-utils.js'
import { IdentifierNode, identifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'

export interface ColumnNode extends OperationNode {
  readonly kind: 'ColumnNode'
  readonly column: IdentifierNode
}

/**
 * @internal
 */
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
