import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'

export interface AndNode extends OperationNode {
  readonly kind: 'AndNode'
  readonly left: OperationNode
  readonly right: OperationNode
}

/**
 * @internal
 */
export const AndNode = freeze({
  is(node: OperationNode): node is AndNode {
    return node.kind === 'AndNode'
  },

  create(left: OperationNode, right: OperationNode): AndNode {
    return freeze({
      kind: 'AndNode',
      left,
      right,
    })
  },
})
