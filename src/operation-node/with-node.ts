import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { CommonTableExpressionNode } from './common-table-expression-node.js'

export type WithNodeParams = Omit<WithNode, 'kind' | 'expressions'>

export interface WithNode extends OperationNode {
  readonly kind: 'WithNode'
  readonly expressions: ReadonlyArray<CommonTableExpressionNode>
  readonly recursive?: boolean
}

type WithNodeFactory = Readonly<{
  is(node: OperationNode): node is WithNode
  create(
    expression: CommonTableExpressionNode,
    params?: WithNodeParams,
  ): Readonly<WithNode>
  cloneWithExpression(
    withNode: WithNode,
    expression: CommonTableExpressionNode,
  ): Readonly<WithNode>
}>

/**
 * @internal
 */
export const WithNode: WithNodeFactory = freeze<WithNodeFactory>({
  is(node): node is WithNode {
    return node.kind === 'WithNode'
  },

  create(expression, params?) {
    return freeze({
      kind: 'WithNode',
      expressions: freeze([expression]),
      ...params,
    })
  },

  cloneWithExpression(withNode, expression) {
    return freeze({
      ...withNode,
      expressions: freeze([...withNode.expressions, expression]),
    })
  },
})
