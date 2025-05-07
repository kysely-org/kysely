import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'

export interface DropColumnNode extends OperationNode {
  readonly kind: 'DropColumnNode'
  readonly column: ColumnNode
}

type DropColumnNodeFactory = Readonly<{
  is(node: OperationNode): node is DropColumnNode
  create(column: string): Readonly<DropColumnNode>
}>

/**
 * @internal
 */
export const DropColumnNode: DropColumnNodeFactory =
  freeze<DropColumnNodeFactory>({
    is(node): node is DropColumnNode {
      return node.kind === 'DropColumnNode'
    },

    create(column) {
      return freeze({
        kind: 'DropColumnNode',
        column: ColumnNode.create(column),
      })
    },
  })
