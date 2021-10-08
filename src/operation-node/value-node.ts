import { freeze, PrimitiveValue } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface ValueNode extends OperationNode {
  readonly kind: 'ValueNode'
  readonly value: PrimitiveValue
  readonly immediate?: boolean
}

/**
 * @internal
 */
export const ValueNode = freeze({
  is(node: OperationNode): node is ValueNode {
    return node.kind === 'ValueNode'
  },

  create(value: PrimitiveValue): ValueNode {
    return freeze({
      kind: 'ValueNode',
      value,
    })
  },

  createImmediate(value: PrimitiveValue): ValueNode {
    return freeze({
      kind: 'ValueNode',
      value,
      immediate: true,
    })
  },
})
