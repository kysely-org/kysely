import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface ValueListNode extends OperationNode {
  readonly kind: 'ValueListNode'
  readonly values: ReadonlyArray<OperationNode>
}

type ValueListNodeFactory = Readonly<{
  is(node: OperationNode): node is ValueListNode
  create(values: ReadonlyArray<OperationNode>): Readonly<ValueListNode>
}>

/**
 * @internal
 */
export const ValueListNode: ValueListNodeFactory = freeze<ValueListNodeFactory>(
  {
    is(node): node is ValueListNode {
      return node.kind === 'ValueListNode'
    },

    create(values) {
      return freeze({
        kind: 'ValueListNode',
        values: freeze(values),
      })
    },
  },
)
