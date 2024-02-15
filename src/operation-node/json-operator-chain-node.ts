import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { OperatorNode } from './operator-node.js'
import { ValueNode } from './value-node.js'

export interface JSONOperatorChainNode extends OperationNode {
  readonly kind: 'JSONOperatorChainNode'
  readonly operator: OperatorNode
  readonly values: readonly ValueNode[]
}

/**
 * @internal
 */
export const JSONOperatorChainNode = freeze({
  is(node: OperationNode): node is JSONOperatorChainNode {
    return node.kind === 'JSONOperatorChainNode'
  },

  create(operator: OperatorNode): JSONOperatorChainNode {
    return freeze({
      kind: 'JSONOperatorChainNode',
      operator,
      values: freeze([]),
    })
  },

  cloneWithValue(
    node: JSONOperatorChainNode,
    value: ValueNode,
  ): JSONOperatorChainNode {
    return freeze({
      ...node,
      values: freeze([...node.values, value]),
    })
  },
})
