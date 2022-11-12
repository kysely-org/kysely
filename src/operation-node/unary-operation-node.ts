import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface UnaryOperationNode extends OperationNode {
  readonly kind: 'UnaryOperationNode'
  readonly operator: OperationNode
  readonly operand: OperationNode
}

/**
 * @internal
 */
export const UnaryOperationNode = freeze({
  is(node: OperationNode): node is UnaryOperationNode {
    return node.kind === 'UnaryOperationNode'
  },

  create(operator: OperationNode, operand: OperationNode): UnaryOperationNode {
    return freeze({
      kind: 'UnaryOperationNode',
      operator,
      operand,
    })
  },
})
