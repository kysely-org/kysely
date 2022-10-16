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

  cloneWithFilter(
    havingNode: HavingNode,
    op: 'And' | 'Or',
    filter: OperationNode
  ): HavingNode {
    return freeze({
      ...havingNode,
      having:
        op === 'And'
          ? AndNode.create(havingNode.having, filter)
          : OrNode.create(havingNode.having, filter),
    })
  },
})
