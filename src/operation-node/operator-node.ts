import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export const BINARY_OPERATORS = [
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

export const UNARY_OPERATORS = ['exists', 'not exists'] as const

export type BinaryOperator = typeof BINARY_OPERATORS[number]
export type UnaryOperator = typeof UNARY_OPERATORS[number]
export type Operator = BinaryOperator | UnaryOperator

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
