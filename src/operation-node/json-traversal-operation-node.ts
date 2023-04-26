import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface JSONTraversalOperationNode extends OperationNode {
  readonly kind: 'JSONTraversalOperationNode'
  readonly leftOperand: OperationNode
  readonly operator: OperationNode
  readonly rightOperand: OperationNode
}

/**
 * @internal
 */
export const JSONTraversalOperationNode = freeze({
  is(node: OperationNode): node is JSONTraversalOperationNode {
    return node.kind === 'JSONTraversalOperationNode'
  },

  create(
    leftOperand: OperationNode,
    operator: OperationNode,
    rightOperand: OperationNode
  ): JSONTraversalOperationNode {
    return freeze({
      kind: 'JSONTraversalOperationNode',
      leftOperand,
      operator,
      rightOperand,
    })
  },
})
