import {
  SetOperator,
  SetOperatorNode,
} from '../operation-node/set-operator-node.js'
import { SelectQueryBuilder } from '../query-builder/select-query-builder.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'

export type SetOperatorExpression<DB, O> =
  | SelectQueryBuilder<DB, any, O>
  | RawBuilder<O>

export function parseSetOperator(
  operator: SetOperator,
  expression: SetOperatorExpression<any, any>,
  all: boolean
) {
  return SetOperatorNode.create(operator, expression.toOperationNode(), all)
}
