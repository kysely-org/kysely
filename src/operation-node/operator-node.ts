import { freeze } from '../util/object-utils.js'
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
  '&&',
  '||',
  '@@',
  '@@@',
  '!!',
  '<->',
] as const

export const UNARY_FILTER_OPERATORS = ['exists', 'not exists'] as const

export type ComparisonOperator = typeof COMPARISON_OPERATORS[number]
export type UnaryFilterOperator = typeof UNARY_FILTER_OPERATORS[number]
export type Operator = ComparisonOperator | UnaryFilterOperator

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
