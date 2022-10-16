import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface OrNode extends OperationNode {
  readonly kind: 'OrNode'
  readonly left: OperationNode
  readonly right: OperationNode
}

/**
 * @internal
 */
export const OrNode = freeze({
  is(node: OperationNode): node is OrNode {
    return node.kind === 'OrNode'
  },

  create(left: OperationNode, right: OperationNode): OrNode {
    return freeze({
      kind: 'OrNode',
      left,
      right,
    })
  },
})
