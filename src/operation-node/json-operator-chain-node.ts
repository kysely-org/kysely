import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { OperatorNode } from './operator-node.js'
import { ValueNode } from './value-node.js'

export interface JSONOperatorChainNode extends OperationNode {
  readonly kind: 'JSONOperatorChainNode'
  readonly operator: OperatorNode
  readonly values: readonly ValueNode[]
}

type JSONOperatorChainNodeFactory = Readonly<{
  is(node: OperationNode): node is JSONOperatorChainNode
  create(operator: OperatorNode): Readonly<JSONOperatorChainNode>
  cloneWithValue(
    node: JSONOperatorChainNode,
    value: ValueNode,
  ): Readonly<JSONOperatorChainNode>
}>

/**
 * @internal
 */
export const JSONOperatorChainNode: JSONOperatorChainNodeFactory =
  freeze<JSONOperatorChainNodeFactory>({
    is(node): node is JSONOperatorChainNode {
      return node.kind === 'JSONOperatorChainNode'
    },

    create(operator) {
      return freeze({
        kind: 'JSONOperatorChainNode',
        operator,
        values: freeze([]),
      })
    },

    cloneWithValue(node, value) {
      return freeze({
        ...node,
        values: freeze([...node.values, value]),
      })
    },
  })
