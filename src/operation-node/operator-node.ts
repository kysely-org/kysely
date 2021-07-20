import { ArrayItemType } from '../query-builder/type-utils'
import { freeze } from '../util/object-utils'
import { OperationNode } from './operation-node'

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
  'exists',
  'not exists',
] as const

export type Operator = ArrayItemType<typeof OPERATORS>

export interface OperatorNode extends OperationNode {
  readonly kind: 'OperatorNode'
  readonly operator: Operator
}

export const operatorNode = freeze({
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
