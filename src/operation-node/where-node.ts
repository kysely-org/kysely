import { freeze } from '../util/object-utils'
import { AndNode, andNode } from './and-node'
import { FilterNode } from './filter-node'
import { OperationNode } from './operation-node'
import { OrNode, orNode } from './or-node'
import { ParensNode } from './parens-node'

export type WhereChildNode = FilterNode | AndNode | OrNode | ParensNode

export interface WhereNode extends OperationNode {
  readonly kind: 'WhereNode'
  readonly where: WhereChildNode
}

/**
 * @internal
 */
export const whereNode = freeze({
  is(node: OperationNode): node is WhereNode {
    return node.kind === 'WhereNode'
  },

  create(filter: WhereChildNode): WhereNode {
    return freeze({
      kind: 'WhereNode',
      where: filter,
    })
  },

  cloneWithFilter(
    whereNode: WhereNode,
    op: 'and' | 'or',
    where: WhereChildNode
  ): WhereNode {
    return freeze({
      ...whereNode,
      where:
        op === 'and'
          ? andNode.create(whereNode.where, where)
          : orNode.create(whereNode.where, where),
    })
  },
})
