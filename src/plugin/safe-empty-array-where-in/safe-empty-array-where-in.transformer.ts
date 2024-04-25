import { BinaryOperationNode } from '../../operation-node/binary-operation-node.js'
import { OperationNode } from '../../operation-node/operation-node.js'
import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js'
import { PrimitiveValueListNode } from '../../operation-node/primitive-value-list-node.js'
import { OperatorNode } from '../../operation-node/operator-node.js'
import { freeze } from '../../util/object-utils.js'

export class WithSafeArrayWhereInTransformer extends OperationNodeTransformer {
  #isInOperatorNode(node: OperationNode): node is OperatorNode {
    return (
      OperatorNode.is(node) &&
      (node.operator === 'in' || node.operator === 'not in')
    )
  }

  protected transformBinaryOperation(
    node: BinaryOperationNode,
  ): BinaryOperationNode {
    const rightOperand = node.rightOperand
    const operator = node.operator

    if (
      this.#isInOperatorNode(operator) &&
      PrimitiveValueListNode.is(rightOperand)
    ) {
      const values = rightOperand.values

      if (Array.isArray(values) && values.length === 0) {
        return freeze({
          ...node,
          rightOperand: freeze({
            ...rightOperand,
            values: [null],
          }),
        })
      }
    }

    return node
  }
}
