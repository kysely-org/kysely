import { freeze } from '../util/object-utils.js'
import { ColumnDefinitionNode } from './column-definition-node.js'
import { OperationNode } from './operation-node.js'

export interface AddColumnNode extends OperationNode {
  readonly kind: 'AddColumnNode'
  readonly column: ColumnDefinitionNode
}

/**
 * @internal
 */
export const AddColumnNode = freeze({
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
