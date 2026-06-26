import { freeze, isString } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'

export type ComparisonOperator =
  | '='
  | '=='
  | '!='
  | '<>'
  | '>'
  | '>='
  | '<'
  | '<='
  | 'in'
  | 'not in'
  | 'is'
  | 'is not'
  | 'like'
  | 'not like'
  | 'match'
  | 'ilike'
  | 'not ilike'
  | '@>'
  | '<@'
  | '^@'
  | '&&'
  | '?'
  | '?&'
  | '?|'
  | '!<'
  | '!>'
  | '<=>'
  | '!~'
  | '~'
  | '~*'
  | '!~*'
  | '@@'
  | '@@@'
  | '!!'
  | '<->'
  | 'regexp'
  | 'is distinct from'
  | 'is not distinct from'

const COMPARISON_OPERATORS_DICTIONARY: Readonly<
  Record<ComparisonOperator, true>
> = freeze({
  '=': true,
  '==': true,
  '!=': true,
  '<>': true,
  '>': true,
  '>=': true,
  '<': true,
  '<=': true,
  in: true,
  'not in': true,
  is: true,
  'is not': true,
  like: true,
  'not like': true,
  match: true,
  ilike: true,
  'not ilike': true,
  '@>': true,
  '<@': true,
  '^@': true,
  '&&': true,
  '?': true,
  '?&': true,
  '?|': true,
  '!<': true,
  '!>': true,
  '<=>': true,
  '!~': true,
  '~': true,
  '~*': true,
  '!~*': true,
  '@@': true,
  '@@@': true,
  '!!': true,
  '<->': true,
  regexp: true,
  'is distinct from': true,
  'is not distinct from': true,
})

/**
 * @deprecated will be removed in version 0.30.x
 */
export const COMPARISON_OPERATORS: readonly ComparisonOperator[] = Object.keys(
  COMPARISON_OPERATORS_DICTIONARY,
) as never

export type ArithmeticOperator =
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  | '^'
  | '&'
  | '|'
  | '#'
  | '<<'
  | '>>'

const ARITHMETIC_OPERATORS_DICTIONARY: Readonly<
  Record<ArithmeticOperator, true>
> = freeze({
  '+': true,
  '-': true,
  '*': true,
  '/': true,
  '%': true,
  '^': true,
  '&': true,
  '|': true,
  '#': true,
  '<<': true,
  '>>': true,
})

/**
 * @deprecated will be removed in version 0.30.x
 */
export const ARITHMETIC_OPERATORS: readonly ArithmeticOperator[] = Object.keys(
  ARITHMETIC_OPERATORS_DICTIONARY,
) as never

export type JSONOperator = '->' | '->>'
export type JSONOperatorWith$ = JSONOperator | `${JSONOperator}$`

const JSON_OPERATORS_DICTIONARY: Readonly<Record<JSONOperator, true>> = freeze({
  '->': true,
  '->>': true,
})

/**
 * @deprecated will be removed in version 0.30.x
 */
export const JSON_OPERATORS: readonly JSONOperator[] = Object.keys(
  JSON_OPERATORS_DICTIONARY,
) as never

export type BinaryOperator = ComparisonOperator | ArithmeticOperator | '||'

const BINARY_OPERATORS_DICTIONARY: Readonly<Record<BinaryOperator, true>> =
  freeze({
    ...COMPARISON_OPERATORS_DICTIONARY,
    ...ARITHMETIC_OPERATORS_DICTIONARY,
    '||': true,
  })

/**
 * @deprecated will be removed in version 0.30.x
 */
export const BINARY_OPERATORS: readonly BinaryOperator[] = Object.keys(
  BINARY_OPERATORS_DICTIONARY,
) as never

export type UnaryFilterOperator = 'exists' | 'not exists'

const UNARY_FILTER_OPERATORS_DICTIONARY: Readonly<
  Record<UnaryFilterOperator, true>
> = freeze({
  exists: true,
  'not exists': true,
})

/**
 * @deprecated will be removed in version 0.30.x
 */
export const UNARY_FILTER_OPERATORS: readonly UnaryFilterOperator[] =
  Object.keys(UNARY_FILTER_OPERATORS_DICTIONARY) as never

export type UnaryOperator = 'not' | '-' | UnaryFilterOperator

const UNARY_OPERATORS_DICTIONARY: Readonly<Record<UnaryOperator, true>> =
  freeze({
    ...UNARY_FILTER_OPERATORS_DICTIONARY,
    '-': true,
    not: true,
  })

/**
 * @deprecated will be removed in version 0.30.x
 */
export const UNARY_OPERATORS: readonly UnaryOperator[] = Object.keys(
  UNARY_OPERATORS_DICTIONARY,
) as never

export type Operator =
  | BinaryOperator
  | JSONOperator
  | UnaryOperator
  | 'between'
  | 'between symmetric'

/**
 * @deprecated will be removed in version 0.30.x
 */
export const OPERATORS: readonly Operator[] = [
  ...BINARY_OPERATORS,
  ...JSON_OPERATORS,
  ...UNARY_OPERATORS,
  'between',
  'between symmetric',
]

export interface OperatorNode extends OperationNode {
  readonly kind: 'OperatorNode'
  readonly operator: Operator
}

type OperatorNodeFactory = Readonly<{
  is(node: OperationNode): node is OperatorNode
  create(operator: Operator): Readonly<OperatorNode>
}>

/**
 * @internal
 */
export const OperatorNode: OperatorNodeFactory = freeze<OperatorNodeFactory>({
  is(node): node is OperatorNode {
    return node.kind === 'OperatorNode'
  },

  create(operator) {
    return freeze({
      kind: 'OperatorNode',
      operator,
    })
  },
})

/**
 * @deprecated will be removed in version 0.30.x
 */
export function isOperator(op: unknown): op is Operator {
  return isString(op) && OPERATORS.includes(op as never)
}

export function isBinaryOperator(op: unknown): op is BinaryOperator {
  return isString(op) && BINARY_OPERATORS_DICTIONARY[op as never]
}

/**
 * @deprecated will be removed in version 0.30.x
 */
export function isComparisonOperator(op: unknown): op is ComparisonOperator {
  return isString(op) && COMPARISON_OPERATORS.includes(op as never)
}

/**
 * @deprecated will be removed in version 0.30.x
 */
export function isArithmeticOperator(op: unknown): op is ArithmeticOperator {
  return isString(op) && ARITHMETIC_OPERATORS.includes(op as never)
}

export function isJSONOperator(op: unknown): op is JSONOperator {
  return isString(op) && JSON_OPERATORS_DICTIONARY[op as never]
}

export function isUnaryOperator(op: unknown): op is UnaryOperator {
  return isString(op) && UNARY_OPERATORS_DICTIONARY[op as never]
}
