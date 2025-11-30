import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'

export interface ValueNode extends OperationNode {
  readonly kind: 'ValueNode'
  readonly value: unknown
  readonly immediate?: boolean
}

type ValueNodeFactory = Readonly<{
  is(node: OperationNode): node is ValueNode
  create(value: unknown): Readonly<ValueNode>
  createImmediate(value: unknown): Readonly<ValueNode>
}>

/**
 * @internal
 */
export const ValueNode: ValueNodeFactory = freeze<ValueNodeFactory>({
  is(node): node is ValueNode {
    return node.kind === 'ValueNode'
  },

  create(value) {
    return freeze({
      kind: 'ValueNode',
      value,
    })
  },

  createImmediate(value) {
    return freeze({
      kind: 'ValueNode',
      value,
      immediate: true,
    })
  },
})
