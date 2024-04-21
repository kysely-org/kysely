import { freeze } from '../util/object-utils.js'
import { AndNode } from './and-node.js'
import { OperationNode } from './operation-node.js'
import { OrNode } from './or-node.js'

export interface HavingNode extends OperationNode {
  readonly kind: 'HavingNode'
  readonly having: OperationNode
}

/**
 * @internal
 */
export const HavingNode = freeze({
  is(node: OperationNode): node is HavingNode {
    return node.kind === 'HavingNode'
  },

  create(filter: OperationNode): HavingNode {
    return freeze({
      kind: 'HavingNode',
      having: filter,
    })
  },

  cloneWithOperation(
    havingNode: HavingNode,
    operator: 'And' | 'Or',
    operation: OperationNode,
  ): HavingNode {
    return freeze({
      ...havingNode,
      having:
        operator === 'And'
          ? AndNode.create(havingNode.having, operation)
          : OrNode.create(havingNode.having, operation),
    })
  },
})
