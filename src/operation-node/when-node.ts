import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface WhenNode extends OperationNode {
  readonly kind: 'WhenNode'
  readonly condition: OperationNode
  readonly then?: OperationNode
}

/**
 * @internal
 */
export const WhenNode = freeze({
  is(node: OperationNode): node is WhenNode {
    return node.kind === 'WhenNode'
  },

  create(condition: OperationNode): WhenNode {
    return freeze({
      kind: 'WhenNode',
      condition,
    })
  },

  cloneWithThen(whenNode: WhenNode, then: OperationNode): WhenNode {
    return freeze({
      ...whenNode,
      then,
    })
  },
})
