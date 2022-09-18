import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { RawNode } from './raw-node.js'
import { SelectQueryNode } from './select-query-node.js'

export type SetOperationExpressionNode = SelectQueryNode | RawNode

export type SetOperator = 'union' | 'intersect' | 'except'

export interface SetOperationNode extends OperationNode {
  kind: 'SetOperationNode'
  operator: SetOperator
  expression: SetOperationExpressionNode
  all: boolean
}

/**
 * @internal
 */
export const SetOperationNode = freeze({
  is(node: OperationNode): node is SetOperationNode {
    return node.kind === 'SetOperationNode'
  },

  create(
    operator: SetOperator,
    expression: SetOperationExpressionNode,
    all: boolean
  ): SetOperationNode {
    return freeze({
      kind: 'SetOperationNode',
      operator,
      expression,
      all,
    })
  },
})
