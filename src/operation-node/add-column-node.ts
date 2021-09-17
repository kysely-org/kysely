import { freeze } from '../util/object-utils'
import { ColumnDefinitionNode } from './column-definition-node'
import { OperationNode } from './operation-node'

export interface AddColumnNode extends OperationNode {
  readonly kind: 'AddColumnNode'
  readonly column: ColumnDefinitionNode
}

/**
 * @internal
 */
export const addColumnNode = freeze({
  is(node: OperationNode): node is AddColumnNode {
    return node.kind === 'AddColumnNode'
  },

  create(column: ColumnDefinitionNode): AddColumnNode {
    return freeze({
      kind: 'AddColumnNode',
      column,
    })
  },
})
