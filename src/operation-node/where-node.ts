import { freeze } from '../util/object-utils.js'
import { AndNode, andNode } from './and-node.js'
import { FilterNode } from './filter-node.js'
import { OperationNode } from './operation-node.js'
import { OrNode, orNode } from './or-node.js'
import { ParensNode } from './parens-node.js'

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
