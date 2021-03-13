import { freeze } from '../utils/object-utils'
import { AndNode, createAndNode } from './and-node'
import { FilterNode } from './filter-node'
import { OperationNode } from './operation-node'
import { createOrNode, OrNode } from './or-node'
import { ParensNode } from './parens-node'

export type WhereChildNode = FilterNode | AndNode | OrNode | ParensNode

export interface WhereNode extends OperationNode {
  readonly kind: 'WhereNode'
  readonly where: WhereChildNode
}

export function isWhereNode(node: OperationNode): node is WhereNode {
  return node.kind === 'WhereNode'
}

export function createWhereNodeWithFilter(filter: WhereChildNode): WhereNode {
  return freeze({
    kind: 'WhereNode',
    where: filter,
  })
}

export function cloneWhereNodeWithFilter(
  whereNode: WhereNode,
  op: 'and' | 'or',
  where: WhereChildNode
): WhereNode {
  return freeze({
    ...whereNode,
    where:
      op === 'and'
        ? createAndNode(whereNode.where, where)
        : createOrNode(whereNode.where, where),
  })
}
