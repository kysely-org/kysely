import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'
import { QueryNode } from './query-node.js'
import { RawNode } from './raw-node.js'

export interface CommonTableExpressionNode extends OperationNode {
  readonly kind: 'CommonTableExpressionNode'
  readonly name: IdentifierNode
  readonly expression: QueryNode | RawNode
}

/**
 * @internal
 */
export const CommonTableExpressionNode = freeze({
  is(node: OperationNode): node is CommonTableExpressionNode {
    return node.kind === 'CommonTableExpressionNode'
  },

  create(
    name: IdentifierNode,
    expression: QueryNode | RawNode
  ): CommonTableExpressionNode {
    return freeze({
      kind: 'CommonTableExpressionNode',
      name,
      expression,
    })
  },
})
