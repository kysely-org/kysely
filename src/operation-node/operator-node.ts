import { ArrayItemType } from '../util/type-utils.js'
import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export const OPERATORS = [
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
  '?',
  '?&',
  '!<',
  '!>',
  '<=>',
  '!~',
  '~',
  '~*',
  '!~*',
  'exists',
  'not exists',
  '&&',
  '||',
  '@@',
  '@@@',
  '!!',
  '<->',
  'between',
  'not between'
] as const

export type Operator = ArrayItemType<typeof OPERATORS>

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
