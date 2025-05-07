import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export type SetOperator = 'union' | 'intersect' | 'except'

export interface SetOperationNode extends OperationNode {
  kind: 'SetOperationNode'
  operator: SetOperator
  expression: OperationNode
  all: boolean
}

type SetOperationNodeFactory = Readonly<{
  is(node: OperationNode): node is SetOperationNode
  create(
    operator: SetOperator,
    expression: OperationNode,
    all: boolean,
  ): Readonly<SetOperationNode>
}>

/**
 * @internal
 */
export const SetOperationNode: SetOperationNodeFactory =
  freeze<SetOperationNodeFactory>({
    is(node): node is SetOperationNode {
      return node.kind === 'SetOperationNode'
    },

    create(operator, expression, all) {
      return freeze({
        kind: 'SetOperationNode',
        operator,
        expression,
        all,
      })
    },
  })
