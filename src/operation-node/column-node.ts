import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'

export interface ColumnNode extends OperationNode {
  readonly kind: 'ColumnNode'
  readonly column: IdentifierNode
}

type ColumnNodeFactory = Readonly<{
  is(node: OperationNode): node is ColumnNode
  create(column: string): Readonly<ColumnNode>
}>

/**
 * @internal
 */
export const ColumnNode: ColumnNodeFactory = freeze<ColumnNodeFactory>({
  is(node): node is ColumnNode {
    return node.kind === 'ColumnNode'
  },

  create(column) {
    return freeze({
      kind: 'ColumnNode',
      column: IdentifierNode.create(column),
    })
  },
})
