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
      // Emit the null operand inline as the SQL keyword `null` rather
      // than preserving the parameterised `ValueNode`. The compiled
      // shape `... IS <placeholder>` is non-standard SQL — strict-ANSI
      // parsers (PostgreSQL, Microsoft SQL Server) reject it at parse
      // time. `createImmediate(null)` routes through `appendImmediateValue`
      // in the default query compiler, which writes the literal `null`
      // keyword. Resulting `... IS NULL` / `... IS NOT NULL` is the
      // ANSI-standard null-predicate form and is valid across every
      // dialect Kysely supports.
      //
      // Fixes #1830.
      ValueNode.createImmediate(null),
    )
  }
}
