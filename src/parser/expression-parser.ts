import {
  AliasedExpression,
  Expression,
  isAliasedExpression,
  isExpression,
} from '../expression/expression.js'
import { AliasNode } from '../operation-node/alias-node.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { OperationNode } from '../operation-node/operation-node.js'
import {
  expressionBuilder,
  ExpressionBuilder,
} from '../expression/expression-builder.js'
import { SelectQueryBuilderExpression } from '../query-builder/select-query-builder-expression.js'
import { isFunction } from '../util/object-utils.js'

/**
 * Like `Expression<V>` but also accepts a select query with an output
 * type extending `Record<string, V>`. This type is useful because SQL
 * treats records with a single column as single values.
 */
export type OperandExpression<V> =
  // SQL treats a subquery with a single selection as a scalar. That's
  // why we need to explicitly allow `SelectQueryBuilder` here with a
  // `Record<string, V>` output type, even though `SelectQueryBuilder`
  // is also an `Expression`.
  Expression<V> | SelectQueryBuilderExpression<Record<string, V>>

export type ExpressionOrFactory<DB, TB extends keyof DB, V> =
  | OperandExpression<V>
  | OperandExpressionFactory<DB, TB, V>

export type AliasedExpressionOrFactory<DB, TB extends keyof DB> =
  | AliasedExpression<any, any>
  | AliasedExpressionFactory<DB, TB>

export type ExpressionFactory<DB, TB extends keyof DB, V> = (
  eb: ExpressionBuilder<DB, TB>,
) => Expression<V>

type OperandExpressionFactory<DB, TB extends keyof DB, V> = (
  eb: ExpressionBuilder<DB, TB>,
) => OperandExpression<V>

export type AliasedExpressionFactory<DB, TB extends keyof DB> = (
  eb: ExpressionBuilder<DB, TB>,
) => AliasedExpression<any, any>

export function parseExpression(
  exp: ExpressionOrFactory<any, any, any>,
): OperationNode {
  if (isOperationNodeSource(exp)) {
    return exp.toOperationNode()
  } else if (isFunction(exp)) {
    return exp(expressionBuilder()).toOperationNode()
  }

  throw new Error(`invalid expression: ${JSON.stringify(exp)}`)
}

export function parseAliasedExpression(
  exp: AliasedExpressionOrFactory<any, any>,
): AliasNode {
  if (isOperationNodeSource(exp)) {
    return exp.toOperationNode()
  } else if (isFunction(exp)) {
    return exp(expressionBuilder()).toOperationNode()
  }

  throw new Error(`invalid aliased expression: ${JSON.stringify(exp)}`)
}

export function isExpressionOrFactory(
  obj: unknown,
): obj is ExpressionOrFactory<any, any, any> {
  return isExpression(obj) || isAliasedExpression(obj) || isFunction(obj)
}
