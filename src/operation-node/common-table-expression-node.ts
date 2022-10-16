import { freeze } from '../util/object-utils.js'
import { CommonTableExpressionNameNode } from './common-table-expression-name-node.js'
import { OperationNode } from './operation-node.js'

export interface CommonTableExpressionNode extends OperationNode {
  readonly kind: 'CommonTableExpressionNode'
  readonly name: CommonTableExpressionNameNode
  readonly expression: OperationNode
}

/**
 * @internal
 */
export const CommonTableExpressionNode = freeze({
  is(node: OperationNode): node is CommonTableExpressionNode {
    return node.kind === 'CommonTableExpressionNode'
  },

  create(
    name: CommonTableExpressionNameNode,
    expression: OperationNode
  ): CommonTableExpressionNode {
    return freeze({
      kind: 'CommonTableExpressionNode',
      name,
      expression,
    })
  },
})
