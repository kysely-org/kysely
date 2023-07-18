import { PrimitiveValueListNode } from '../operation-node/primitive-value-list-node.js'
import { ValueListNode } from '../operation-node/value-list-node.js'
import { ValueNode } from '../operation-node/value-node.js'
import {
  isBoolean,
  isNull,
  isNumber,
  isReadonlyArray,
} from '../util/object-utils.js'
import {
  parseExpression,
  ExpressionOrFactory,
  isExpressionOrFactory,
} from './expression-parser.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { Expression } from '../expression/expression.js'
import { SelectQueryBuilder } from '../query-builder/select-query-builder.js'

export type ValueExpression<DB, TB extends keyof DB, V> =
  | V
  | ExpressionOrFactory<DB, TB, V>

export type ValueExpressionOrList<DB, TB extends keyof DB, V> =
  | ValueExpression<DB, TB, V>
  | ReadonlyArray<ValueExpression<DB, TB, V>>

export type ExtractTypeFromValueExpressionOrList<VE> = VE extends ReadonlyArray<
  infer AV
>
  ? ExtractTypeFromValueExpression<AV>
  : ExtractTypeFromValueExpression<VE>

type ExtractTypeFromValueExpression<VE> = VE extends SelectQueryBuilder<
  any,
  any,
  Record<string, infer SV>
>
  ? SV
  : VE extends Expression<infer V>
  ? V
  : VE

export function parseValueExpressionOrList(
  arg: ValueExpressionOrList<any, any, unknown>
): OperationNode {
  if (isReadonlyArray(arg)) {
    return parseValueExpressionList(arg)
  }

  return parseValueExpression(arg)
}

export function parseValueExpression(
  exp: ValueExpression<any, any, unknown>
): OperationNode {
  if (isExpressionOrFactory(exp)) {
    return parseExpression(exp)
  }

  return ValueNode.create(exp)
}

export function isSafeImmediateValue(
  value: unknown
): value is number | boolean | null {
  return isNumber(value) || isBoolean(value) || isNull(value)
}

export function parseSafeImmediateValue(
  value: number | boolean | null
): ValueNode {
  if (!isSafeImmediateValue(value)) {
    throw new Error(`unsafe immediate value ${JSON.stringify(value)}`)
  }

  return ValueNode.createImmediate(value)
}

function parseValueExpressionList(
  arg: ReadonlyArray<ValueExpression<any, any, unknown>>
): PrimitiveValueListNode | ValueListNode {
  if (arg.some(isExpressionOrFactory)) {
    return ValueListNode.create(arg.map((it) => parseValueExpression(it)))
  }

  return PrimitiveValueListNode.create(arg)
}
