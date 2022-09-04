import { AggregateFunctionNode } from '../operation-node/aggregate-function-node.js'
import { AliasNode } from '../operation-node/alias-node.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { RawNode } from '../operation-node/raw-node.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import { AggregateFunctionBuilder } from '../query-builder/aggregate-function-builder.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'
import { isFunction } from '../util/object-utils.js'
import {
  AliasedQueryBuilderFactory,
  AliasedRawBuilderFactory,
  AnyAliasedQueryBuilder,
  AnyAliasedRawBuilder,
  AnySelectQueryBuilder,
  SelectQueryBuilderFactory,
  RawBuilderFactory,
  AggregateFunctionBuilderFactory,
  AliasedAggregateFunctionBuilderFactory,
  AnyAliasedAggregateFunctionBuilder,
} from '../util/type-utils.js'
import { createExpressionBuilder } from './parse-utils.js'

export type ComplexExpression<DB, TB extends keyof DB, V = any> =
  | AnySelectQueryBuilder
  | SelectQueryBuilderFactory<DB, TB>
  | RawBuilder<V>
  | RawBuilderFactory<DB, TB, V>
  | AggregateFunctionBuilder<DB, TB, V>
  | AggregateFunctionBuilderFactory<DB, TB, V>

export type AliasedComplexExpression<DB, TB extends keyof DB> =
  | AnyAliasedQueryBuilder
  | AliasedQueryBuilderFactory<DB, TB>
  | AnyAliasedRawBuilder
  | AliasedRawBuilderFactory<DB, TB>
  | AnyAliasedAggregateFunctionBuilder
  | AliasedAggregateFunctionBuilderFactory<DB, TB>

export function parseComplexExpression(
  exp: ComplexExpression<any, any>
): SelectQueryNode | RawNode | AggregateFunctionNode {
  if (isOperationNodeSource(exp)) {
    return exp.toOperationNode()
  } else if (isFunction(exp)) {
    return exp(createExpressionBuilder()).toOperationNode()
  }

  throw new Error(`invalid expression: ${JSON.stringify(exp)}`)
}

export function parseAliasedComplexExpression(
  exp: AliasedComplexExpression<any, any>
): AliasNode {
  if (isOperationNodeSource(exp)) {
    return exp.toOperationNode()
  } else if (isFunction(exp)) {
    return exp(createExpressionBuilder()).toOperationNode()
  }

  throw new Error(`invalid aliased expression: ${JSON.stringify(exp)}`)
}

export function isComplexExpression(
  obj: unknown
): obj is ComplexExpression<any, any> {
  return isOperationNodeSource(obj) || isFunction(obj)
}
