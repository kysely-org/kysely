import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { RawNode } from './raw-node.js'
import { SelectQueryNode } from './select-query-node.js'

export type SetOperatorExpressionNode = SelectQueryNode | RawNode

export type SetOperator = 'union' | 'interect' | 'except' | 'minus'

export interface SetOperatorNode extends OperationNode {
  kind: 'SetOperatorNode'
  operator: SetOperator
  expression: SetOperatorExpressionNode
  all: boolean
}

/**
 * @internal
 */
export const SetOperatorNode = freeze({
  is(node: OperationNode): node is SetOperatorNode {
    return node.kind === 'SetOperatorNode'
  },

  create(
    operator: SetOperator,
    expression: SetOperatorExpressionNode,
    all: boolean
  ): SetOperatorNode {
    return freeze({
      kind: 'SetOperatorNode',
      operator,
      expression,
      all,
    })
  },
})
