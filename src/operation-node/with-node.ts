import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { CommonTableExpressionNode } from './common-table-expression-node.js'

export interface WithNode extends OperationNode {
  readonly kind: 'WithNode'
  readonly expressions: ReadonlyArray<CommonTableExpressionNode>
}

/**
 * @internal
 */
export const WithNode = freeze({
  is(node: OperationNode): node is WithNode {
    return node.kind === 'WithNode'
  },

  create(expression: CommonTableExpressionNode): WithNode {
    return freeze({
      kind: 'WithNode',
      expressions: freeze([expression]),
    })
  },

  cloneWithExpression(
    withNode: WithNode,
    expression: CommonTableExpressionNode
  ): WithNode {
    return freeze({
      ...withNode,
      expressions: freeze([...withNode.expressions, expression]),
    })
  },
})
