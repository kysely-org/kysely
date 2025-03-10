import { BinaryOperationNode } from '../../operation-node/binary-operation-node.js'
import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js'
import { OperatorNode } from '../../operation-node/operator-node.js'
import { ValueNode } from '../../operation-node/value-node.js'

export class SafeNullComparisonTransformer extends OperationNodeTransformer {
  protected transformBinaryOperation(
    node: BinaryOperationNode,
  ): BinaryOperationNode {
    const { operator, leftOperand, rightOperand } =
      super.transformBinaryOperation(node)

    if (
      !ValueNode.is(rightOperand) ||
      rightOperand.value !== null ||
      !OperatorNode.is(operator)
    ) {
      return node
    }

    const op = operator.operator
    if (op !== '=' && op !== '!=' && op !== '<>') {
      return node
    }

    return BinaryOperationNode.create(
      leftOperand,
      OperatorNode.create(op === '=' ? 'is' : 'is not'),
      rightOperand,
    )
  }
}
