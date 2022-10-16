import { Expression } from '../expression/expression.js'
import {
  SetOperator,
  SetOperationNode,
} from '../operation-node/set-operation-node.js'

export function parseSetOperation(
  operator: SetOperator,
  expression: Expression<any>,
  all: boolean
) {
  return SetOperationNode.create(operator, expression.toOperationNode(), all)
}
