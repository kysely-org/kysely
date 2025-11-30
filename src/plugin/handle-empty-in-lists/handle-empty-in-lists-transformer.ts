import type { BinaryOperationNode } from '../../operation-node/binary-operation-node.js'
import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js'
import { PrimitiveValueListNode } from '../../operation-node/primitive-value-list-node.js'
import { OperatorNode } from '../../operation-node/operator-node.js'
import type {
  EmptyInListNode,
  EmptyInListsStrategy,
} from './handle-empty-in-lists.js'
import { ValueListNode } from '../../operation-node/value-list-node.js'

export class HandleEmptyInListsTransformer extends OperationNodeTransformer {
  readonly #strategy: EmptyInListsStrategy

  constructor(strategy: EmptyInListsStrategy) {
    super()
    this.#strategy = strategy
  }

  protected transformBinaryOperation(
    node: BinaryOperationNode,
  ): BinaryOperationNode {
    if (this.#isEmptyInListNode(node)) {
      return this.#strategy(node)
    }

    return node
  }

  #isEmptyInListNode(node: BinaryOperationNode): node is EmptyInListNode {
    const { operator, rightOperand } = node

    return (
      (PrimitiveValueListNode.is(rightOperand) ||
        ValueListNode.is(rightOperand)) &&
      rightOperand.values.length === 0 &&
      OperatorNode.is(operator) &&
      (operator.operator === 'in' || operator.operator === 'not in')
    )
  }
}
