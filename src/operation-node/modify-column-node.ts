import { freeze } from '../util/object-utils.js'
import { ColumnDefinitionNode } from './column-definition-node.js'
import { OperationNode } from './operation-node.js'

export interface ModifyColumnNode extends OperationNode {
  readonly kind: 'ModifyColumnNode'
  readonly column: ColumnDefinitionNode
}

type ModifyColumnNodeFactory = Readonly<{
  is(node: OperationNode): node is ModifyColumnNode
  create(column: ColumnDefinitionNode): Readonly<ModifyColumnNode>
}>

/**
 * @internal
 */
export const ModifyColumnNode: ModifyColumnNodeFactory =
  freeze<ModifyColumnNodeFactory>({
    is(node): node is ModifyColumnNode {
      return node.kind === 'ModifyColumnNode'
    },

    create(column) {
      return freeze({
        kind: 'ModifyColumnNode',
        column,
      })
    },
  })
