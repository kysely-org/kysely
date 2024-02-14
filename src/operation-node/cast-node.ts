import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'

export interface CastNode extends OperationNode {
  readonly kind: 'CastNode'
  readonly expression: OperationNode
  readonly dataType: OperationNode
}

/**
 * @internal
 */
export const CastNode = freeze({
  is(node: OperationNode): node is CastNode {
    return node.kind === 'CastNode'
  },

  create(expression: OperationNode, dataType: OperationNode): CastNode {
    return freeze({
      kind: 'CastNode',
      expression,
      dataType,
    })
  },
})
