import { freeze } from '../util/object-utils.js'
import { AndNode } from './and-node.js'
import { FilterNode } from './filter-node.js'
import { OperationNode } from './operation-node.js'
import { OrNode } from './or-node.js'
import { ParensNode } from './parens-node.js'

export type HavingNodeChild = FilterNode | AndNode | OrNode | ParensNode

export interface HavingNode extends OperationNode {
  readonly kind: 'HavingNode'
  readonly having: HavingNodeChild
}

/**
 * @internal
 */
export const HavingNode = freeze({
  is(node: OperationNode): node is HavingNode {
    return node.kind === 'HavingNode'
  },

  create(filter: HavingNodeChild): HavingNode {
    return freeze({
      kind: 'HavingNode',
      having: filter,
    })
  },

  cloneWithFilter(
    havingNode: HavingNode,
    op: 'And' | 'Or',
    having: HavingNodeChild
  ): HavingNode {
    return freeze({
      ...havingNode,
      having:
        op === 'And'
          ? AndNode.create(havingNode.having, having)
          : OrNode.create(havingNode.having, having),
    })
  },
})
