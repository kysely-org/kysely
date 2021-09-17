import { freeze } from '../util/object-utils'
import { AndNode, andNode } from './and-node'
import { FilterNode } from './filter-node'
import { OperationNode } from './operation-node'
import { OrNode, orNode } from './or-node'
import { ParensNode } from './parens-node'

export type HavingNodeChild = FilterNode | AndNode | OrNode | ParensNode

export interface HavingNode extends OperationNode {
  readonly kind: 'HavingNode'
  readonly having: HavingNodeChild
}

/**
 * @internal
 */
export const havingNode = freeze({
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
    op: 'and' | 'or',
    having: HavingNodeChild
  ): HavingNode {
    return freeze({
      ...havingNode,
      having:
        op === 'and'
          ? andNode.create(havingNode.having, having)
          : orNode.create(havingNode.having, having),
    })
  },
})
