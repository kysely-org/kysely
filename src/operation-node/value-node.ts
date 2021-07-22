import { freeze, PrimitiveValue } from '../util/object-utils'
import { OperationNode } from './operation-node'

export interface ValueNode extends OperationNode {
  readonly kind: 'ValueNode'
  readonly value: PrimitiveValue
  readonly immediate?: boolean
}

export const valueNode = freeze({
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
