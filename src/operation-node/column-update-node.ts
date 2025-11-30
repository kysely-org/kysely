import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'

export interface ColumnUpdateNode extends OperationNode {
  readonly kind: 'ColumnUpdateNode'
  readonly column: OperationNode
  readonly value: OperationNode
}

type ColumnUpdateNodeFactory = Readonly<{
  is(node: OperationNode): node is ColumnUpdateNode
  create(
    column: OperationNode,
    value: OperationNode,
  ): Readonly<ColumnUpdateNode>
}>

/**
 * @internal
 */
export const ColumnUpdateNode: ColumnUpdateNodeFactory =
  freeze<ColumnUpdateNodeFactory>({
    is(node): node is ColumnUpdateNode {
      return node.kind === 'ColumnUpdateNode'
    },

    create(column, value) {
      return freeze({
        kind: 'ColumnUpdateNode',
        column,
        value,
      })
    },
  })
