import {
  SetOperator,
  SetOperationNode,
} from '../operation-node/set-operation-node.js'
import { SelectQueryBuilder } from '../query-builder/select-query-builder.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'

export type SetOperationExpression<DB, O> =
  | SelectQueryBuilder<DB, any, O>
  | RawBuilder<O>

export function parseSetOperation(
  operator: SetOperator,
  expression: SetOperationExpression<any, any>,
  all: boolean
) {
  return SetOperationNode.create(operator, expression.toOperationNode(), all)
}
