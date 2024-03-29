import { BinaryOperationNode } from '../../operation-node/binary-operation-node.js'
import { OperationNode } from '../../operation-node/operation-node.js'
import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js'
import { PrimitiveValueListNode } from '../../operation-node/primitive-value-list-node.js'
import { WhereNode } from '../../operation-node/where-node.js'

const IN_OPERATORS = ['in', 'not in'] as const

interface InOperatorNode {
  kind: 'OperatorNode'
  operator: (typeof IN_OPERATORS)[number]
}

export class WithSafeArrayWhereInTransformer extends OperationNodeTransformer {
  #BinaryOperationNode(node: OperationNode): node is BinaryOperationNode {
    return node.kind === 'BinaryOperationNode'
  }

  #isPrimitiveValueListNode(
    node: OperationNode,
  ): node is PrimitiveValueListNode {
    return node.kind === 'PrimitiveValueListNode'
  }

  #IsInOperatorNode(node: OperationNode): node is InOperatorNode {
    return (
      (node as InOperatorNode).kind === 'OperatorNode' &&
      IN_OPERATORS.includes((node as InOperatorNode).operator)
    )
  }

  protected transformWhere(node: WhereNode): WhereNode {
    const binaryOperatorNode = node.where

    if (!this.#BinaryOperationNode(binaryOperatorNode)) {
      return node
    }

    const rightOperand = binaryOperatorNode.rightOperand
    const operator = binaryOperatorNode.operator

    if (
      this.#IsInOperatorNode(operator) &&
      this.#isPrimitiveValueListNode(rightOperand)
    ) {
      const values = rightOperand.values

      if (Array.isArray(values) && values.length === 0) {
        return Object.freeze({
          ...node,
          where: {
            ...binaryOperatorNode,
            rightOperand: {
              ...rightOperand,
              values: [null],
            },
          },
        })
      }
    }

    return node
  }
}
