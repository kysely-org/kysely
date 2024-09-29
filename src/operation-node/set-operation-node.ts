import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export type SetOperator = 'union' | 'intersect' | 'except'

export interface SetOperationNode extends OperationNode {
  kind: 'SetOperationNode'
  operator: SetOperator
  expression: OperationNode
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
    expression: OperationNode,
    all: boolean,
  ): SetOperationNode {
    return freeze({
      kind: 'SetOperationNode',
      operator,
      expression,
      all,
    })
  },
})
