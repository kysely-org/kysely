import { freeze } from '../util/object-utils'
import { IdentifierNode } from './identifier-node'
import { OperationNode } from './operation-node'
import { QueryNode } from './query-node'
import { RawNode } from './raw-node'

export interface CommonTableExpressionNode extends OperationNode {
  readonly kind: 'CommonTableExpressionNode'
  readonly name: IdentifierNode
  readonly expression: QueryNode | RawNode
}

export const commonTableExpressionNode = freeze({
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
