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
import { SelectQueryBuilder } from '../query-builder/select-query-builder.js'
import { isFunction } from '../util/object-utils.js'
import { ShallowRecord } from '../util/type-utils.js'

export type ExpressionOrFactory<DB, TB extends keyof DB, V> =
  // SQL treats a subquery with a single selection as a scalar. That's
  // why we need to explicitly allow `SelectQueryBuilder` here with a
  // `ShallowRecord<string, V>` output type, even though `SelectQueryBuilder`
  // is also an `Expression`.
  | SelectQueryBuilder<any, any, ShallowRecord<string, V>>
  | SelectQueryBuilderFactory<DB, TB, ShallowRecord<string, V>>
  | Expression<V>
  | ExpressionFactory<DB, TB, V>

export type AliasedExpressionOrFactory<DB, TB extends keyof DB> =
  | AliasedExpression<any, any>
  | AliasedExpressionFactory<DB, TB>

type SelectQueryBuilderFactory<DB, TB extends keyof DB, V> = (
  eb: ExpressionBuilder<DB, TB>
) => SelectQueryBuilder<any, any, V>

type ExpressionFactory<DB, TB extends keyof DB, V> = (
  eb: ExpressionBuilder<DB, TB>
) => Expression<V>

type AliasedExpressionFactory<DB, TB extends keyof DB> = (
  eb: ExpressionBuilder<DB, TB>
) => AliasedExpression<any, any>

export function parseExpression(
  exp: ExpressionOrFactory<any, any, any>
): OperationNode {
  if (isOperationNodeSource(exp)) {
    return exp.toOperationNode()
  } else if (isFunction(exp)) {
    return exp(expressionBuilder()).toOperationNode()
  }

  throw new Error(`invalid expression: ${JSON.stringify(exp)}`)
}

export function parseAliasedExpression(
  exp: AliasedExpressionOrFactory<any, any>
): AliasNode {
  if (isOperationNodeSource(exp)) {
    return exp.toOperationNode()
  } else if (isFunction(exp)) {
    return exp(expressionBuilder()).toOperationNode()
  }

  throw new Error(`invalid aliased expression: ${JSON.stringify(exp)}`)
}

export function isExpressionOrFactory(
  obj: unknown
): obj is ExpressionOrFactory<any, any, any> {
  return isExpression(obj) || isAliasedExpression(obj) || isFunction(obj)
}
