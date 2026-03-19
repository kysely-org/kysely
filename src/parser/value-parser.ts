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
  type ExpressionOrFactory,
  isExpressionOrFactory,
} from './expression-parser.js'
import type { OperationNode } from '../operation-node/operation-node.js'
import type { Expression } from '../expression/expression.js'
import type { SelectQueryBuilderExpression } from '../query-builder/select-query-builder-expression.js'

export type ValueExpression<DB, TB extends keyof DB, V> =
  | V
  | ExpressionOrFactory<DB, TB, V>

export type ValueExpressionOrList<DB, TB extends keyof DB, V> =
  | ValueExpression<DB, TB, V>
  | ReadonlyArray<ValueExpression<DB, TB, V>>

export type ExtractTypeFromValueExpressionOrList<VE> =
  VE extends ReadonlyArray<infer AV>
    ? ExtractTypeFromValueExpression<AV>
    : ExtractTypeFromValueExpression<VE>

export type ExtractTypeFromValueExpression<VE> =
  VE extends SelectQueryBuilderExpression<Record<string, infer SV>>
    ? SV
    : VE extends Expression<infer V>
      ? V
      : VE

export function parseValueExpressionOrList(
  arg: ValueExpressionOrList<any, any, unknown>,
): OperationNode {
  if (isReadonlyArray(arg)) {
    return parseValueExpressionList(arg)
  }

  return parseValueExpression(arg)
}

export function parseValueExpression(
  exp: ValueExpression<any, any, unknown>,
): OperationNode {
  if (isExpressionOrFactory(exp)) {
    return parseExpression(exp)
  }

  return ValueNode.create(exp)
}

/**
 * Checks if a value is safe to inline directly into the SQL query string
 * without parameterization.
 *
 * Numbers, booleans, and nulls are considered safe immediate values. These
 * are inlined into the query string (e.g. `then 1`, `else true`, `else null`)
 * instead of being added as parameters (e.g. `then $1`).
 *
 * This is used in {@link CaseThenBuilder.then | case().when().then()} and
 * {@link CaseWhenBuilder.else | case().when().then().else()} to allow the
 * database engine to infer the correct data type of the `case` expression.
 * Without this, values would be parameterized as text, and the database
 * engine would return the result as a string instead of the expected type.
 *
 * String values are NOT considered safe immediate values and are always
 * parameterized to prevent SQL injection. Use `eb.lit('string')` to inline
 * string literals.
 */
export function isSafeImmediateValue(
  value: unknown,
): value is number | boolean | null {
  return isNumber(value) || isBoolean(value) || isNull(value)
}

/**
 * Parses a safe immediate value into a {@link ValueNode} with `immediate: true`.
 *
 * The resulting node is inlined directly into the SQL query string rather than
 * being added to the parameters array. Only numbers, booleans, and nulls are
 * accepted. Throws an error if the value is not a safe immediate value.
 *
 * @see {@link isSafeImmediateValue} for details on why certain values are inlined.
 */
export function parseSafeImmediateValue(
  value: number | boolean | null,
): ValueNode {
  if (!isSafeImmediateValue(value)) {
    throw new Error(`unsafe immediate value ${JSON.stringify(value)}`)
  }

  return ValueNode.createImmediate(value)
}

function parseValueExpressionList(
  arg: ReadonlyArray<ValueExpression<any, any, unknown>>,
): PrimitiveValueListNode | ValueListNode {
  if (arg.some(isExpressionOrFactory)) {
    return ValueListNode.create(arg.map((it) => parseValueExpression(it)))
  }

  return PrimitiveValueListNode.create(arg)
}
