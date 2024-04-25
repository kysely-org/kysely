import { BinaryOperationNode } from '../../operation-node/binary-operation-node.js'
import { OperationNode } from '../../operation-node/operation-node.js'
import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js'
import { PrimitiveValueListNode } from '../../operation-node/primitive-value-list-node.js'
import { WhereNode } from '../../operation-node/where-node.js'
import { OperatorNode } from '../../operation-node/operator-node.js'
import { freeze } from '../../util/object-utils.js'


export class WithSafeArrayWhereInTransformer extends OperationNodeTransformer {
  #isInOperatorNode(node: OperationNode): node is OperatorNode {
    return OperatorNode.is(node) && (node.operator === 'in' || node.operator === 'not in')
  }

  protected transformWhere(node: WhereNode): WhereNode {
    const binaryOperatorNode = node.where

    if (!BinaryOperationNode.is(binaryOperatorNode)) {
      return node
    }

    const rightOperand = binaryOperatorNode.rightOperand
    const operator = binaryOperatorNode.operator

    if (
      this.#isInOperatorNode(operator) &&
      PrimitiveValueListNode.is(rightOperand)
    ) {
      console.log("> TEST", operator, rightOperand)
      const values = rightOperand.values

      if (Array.isArray(values) && values.length === 0) {
        return freeze({
          ...node,
          where: freeze({
            ...binaryOperatorNode,
            rightOperand: freeze({
              ...rightOperand,
              values: [null],
            }),
          }),
        })
      }
    }

    return node
  }
}
