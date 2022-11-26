import {
  AliasedExpression,
  Expression,
  isExpression,
} from '../expression/expression.js'
import { AliasNode } from '../operation-node/alias-node.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { SimpleReferenceExpressionNode } from '../operation-node/simple-reference-expression-node.js'
import { ExpressionBuilder } from '../query-builder/expression-builder.js'
import { SelectQueryBuilder } from '../query-builder/select-query-builder.js'
import { isFunction } from '../util/object-utils.js'
import { createExpressionBuilder } from './parse-utils.js'

export type ExpressionOrFactory<DB, TB extends keyof DB, V> =
  // SQL treats a subquery with a single selection as a scalar. That's
  // why we need to explicitly allow `SelectQueryBuilder` here with a
  // `Record<string, V>` output type, even though `SelectQueryBuilder`
  // is also an `Expression`.
  | SelectQueryBuilder<any, any, Record<string, V>>
  | ((
      eb: ExpressionBuilder<DB, TB>
    ) => SelectQueryBuilder<any, any, Record<string, V>>)
  | Expression<V>
  | ((eb: ExpressionBuilder<DB, TB>) => Expression<V>)

export type AliasedExpressionOrFactory<DB, TB extends keyof DB> =
  | AliasedExpression<any, any>
  | ((qb: ExpressionBuilder<DB, TB>) => AliasedExpression<any, any>)

export function parseExpression(
  exp: ExpressionOrFactory<any, any, any>
): SimpleReferenceExpressionNode {
  if (isOperationNodeSource(exp)) {
    return exp.toOperationNode() as SimpleReferenceExpressionNode
  } else if (isFunction(exp)) {
    return exp(
      createExpressionBuilder()
    ).toOperationNode() as SimpleReferenceExpressionNode
  }

  throw new Error(`invalid expression: ${JSON.stringify(exp)}`)
}

export function parseAliasedExpression(
  exp: AliasedExpressionOrFactory<any, any>
): AliasNode {
  if (isOperationNodeSource(exp)) {
    return exp.toOperationNode()
  } else if (isFunction(exp)) {
    return exp(createExpressionBuilder()).toOperationNode()
  }

  throw new Error(`invalid aliased expression: ${JSON.stringify(exp)}`)
}

export function isExpressionOrFactory(
  obj: unknown
): obj is ExpressionOrFactory<any, any, any> {
  return isExpression(obj) || isFunction(obj)
}
