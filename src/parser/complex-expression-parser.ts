import { AliasNode } from '../index.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { RawNode } from '../operation-node/raw-node.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import { isFunction } from '../util/object-utils.js'
import {
  AliasedQueryBuilderFactory,
  AliasedRawBuilderFactory,
  AnyAliasedQueryBuilder,
  AnyAliasedRawBuilder,
  AnySelectQueryBuilder,
  AnyRawBuilder,
  SelectQueryBuilderFactory,
  RawBuilderFactory,
} from '../util/type-utils.js'
import { ParseContext } from './parse-context.js'

export type ComplexExpression<DB, TB extends keyof DB> =
  | AnySelectQueryBuilder
  | SelectQueryBuilderFactory<DB, TB>
  | AnyRawBuilder
  | RawBuilderFactory<DB, TB>

export type AliasedComplexExpression<DB, TB extends keyof DB> =
  | AnyAliasedQueryBuilder
  | AliasedQueryBuilderFactory<DB, TB>
  | AnyAliasedRawBuilder
  | AliasedRawBuilderFactory<DB, TB>

export function parseComplexExpression(
  ctx: ParseContext,
  exp: ComplexExpression<any, any>
): SelectQueryNode | RawNode {
  if (isOperationNodeSource(exp)) {
    return exp.toOperationNode()
  } else if (isFunction(exp)) {
    return exp(ctx.createExpressionBuilder()).toOperationNode()
  }

  throw new Error(`invalid expression: ${JSON.stringify(exp)}`)
}

export function parseAliasedComplexExpression(
  ctx: ParseContext,
  exp: AliasedComplexExpression<any, any>
): AliasNode {
  if (isOperationNodeSource(exp)) {
    return exp.toOperationNode()
  } else if (isFunction(exp)) {
    return exp(ctx.createExpressionBuilder()).toOperationNode()
  }

  throw new Error(`invalid aliased expression: ${JSON.stringify(exp)}`)
}
