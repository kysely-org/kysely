import { freeze, isString } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export const COMPARISON_OPERATORS = [
  '=',
  '==',
  '!=',
  '<>',
  '>',
  '>=',
  '<',
  '<=',
  'in',
  'not in',
  'is',
  'is not',
  'like',
  'not like',
  'match',
  'ilike',
  'not ilike',
  '@>',
  '<@',
  '?',
  '?&',
  '!<',
  '!>',
  '<=>',
  '!~',
  '~',
  '~*',
  '!~*',
  '@@',
  '@@@',
  '!!',
  '<->',
] as const

export const ARITHMETIC_OPERATORS = [
  '+',
  '-',
  '*',
  '/',
  '%',
  '^',
  '&',
  '|',
  '#',
  '<<',
  '>>',
] as const

export const JSON_OPERATORS = ['->>', '->>$'] as const

export const BINARY_OPERATORS = [
  ...COMPARISON_OPERATORS,
  ...ARITHMETIC_OPERATORS,
  '&&',
  '||',
] as const

export const UNARY_FILTER_OPERATORS = ['exists', 'not exists'] as const
export const UNARY_OPERATORS = ['not', '-', ...UNARY_FILTER_OPERATORS] as const
export const OPERATORS = [
  ...BINARY_OPERATORS,
  ...JSON_OPERATORS,
  ...UNARY_OPERATORS,
] as const

export type ComparisonOperator = (typeof COMPARISON_OPERATORS)[number]
export type ArithmeticOperator = (typeof ARITHMETIC_OPERATORS)[number]
export type JSONOperator = (typeof JSON_OPERATORS)[number]
export type BinaryOperator = (typeof BINARY_OPERATORS)[number]
export type UnaryOperator = (typeof UNARY_OPERATORS)[number]
export type UnaryFilterOperator = (typeof UNARY_FILTER_OPERATORS)[number]
export type Operator = (typeof OPERATORS)[number]

export interface OperatorNode extends OperationNode {
  readonly kind: 'OperatorNode'
  readonly operator: Operator
}

/**
 * @internal
 */
export const OperatorNode = freeze({
  is(node: OperationNode): node is OperatorNode {
    return node.kind === 'OperatorNode'
  },

  create(operator: Operator): OperatorNode {
    return freeze({
      kind: 'OperatorNode',
      operator,
    })
  },
})

export function isOperator(op: unknown): op is Operator {
  return isString(op) && OPERATORS.includes(op as Operator)
}

export function isBinaryOperator(op: unknown): op is BinaryOperator {
  return isString(op) && BINARY_OPERATORS.includes(op as BinaryOperator)
}

export function isComparisonOperator(op: unknown): op is ComparisonOperator {
  return isString(op) && COMPARISON_OPERATORS.includes(op as ComparisonOperator)
}

export function isArithmeticOperator(op: unknown): op is ArithmeticOperator {
  return isString(op) && ARITHMETIC_OPERATORS.includes(op as ArithmeticOperator)
}

export function isJSONOperator(op: unknown): op is JSONOperator {
  return isString(op) && JSON_OPERATORS.includes(op as JSONOperator)
}
