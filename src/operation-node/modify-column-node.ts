import { freeze } from '../util/object-utils.js'
import { ColumnDefinitionNode } from './column-definition-node.js'
import { OperationNode } from './operation-node.js'

export interface ModifyColumnNode extends OperationNode {
  readonly kind: 'ModifyColumnNode'
  readonly column: ColumnDefinitionNode
}

/**
 * @internal
 */
export const ModifyColumnNode = freeze({
  is(node: OperationNode): node is ModifyColumnNode {
    return node.kind === 'ModifyColumnNode'
  },

  create(column: ColumnDefinitionNode): ModifyColumnNode {
    return freeze({
      kind: 'ModifyColumnNode',
      column,
    })
  },
})
