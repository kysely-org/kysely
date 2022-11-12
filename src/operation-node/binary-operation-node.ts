import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface BinaryOperationNode extends OperationNode {
  readonly kind: 'BinaryOperationNode'
  readonly leftOperand: OperationNode
  readonly operator: OperationNode
  readonly rightOperand: OperationNode
}

/**
 * @internal
 */
export const BinaryOperationNode = freeze({
  is(node: OperationNode): node is BinaryOperationNode {
    return node.kind === 'BinaryOperationNode'
  },

  create(
    leftOperand: OperationNode,
    operator: OperationNode,
    rightOperand: OperationNode
  ): BinaryOperationNode {
    return freeze({
      kind: 'BinaryOperationNode',
      leftOperand,
      operator,
      rightOperand,
    })
  },
})
