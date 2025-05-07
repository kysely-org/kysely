import { freeze } from '../util/object-utils.js'
import { ColumnDefinitionNode } from './column-definition-node.js'
import { OperationNode } from './operation-node.js'

export interface AddColumnNode extends OperationNode {
  readonly kind: 'AddColumnNode'
  readonly column: ColumnDefinitionNode
}

type AddColumnNodeFactory = Readonly<{
  is(node: OperationNode): node is AddColumnNode
  create(column: ColumnDefinitionNode): Readonly<AddColumnNode>
}>

/**
 * @internal
 */
export const AddColumnNode: AddColumnNodeFactory = freeze<AddColumnNodeFactory>(
  {
    is(node): node is AddColumnNode {
      return node.kind === 'AddColumnNode'
    },

    create(column) {
      return freeze({
        kind: 'AddColumnNode',
        column,
      })
    },
  },
)
