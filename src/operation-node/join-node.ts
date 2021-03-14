import { freeze } from '../utils/object-utils'
import { AliasNode } from './alias-node'
import { AndNode, createAndNode } from './and-node'
import { FilterNode } from './filter-node'
import { OperationNode } from './operation-node'
import { createOrNode, OrNode } from './or-node'
import { ParensNode } from './parens-node'
import { TableNode } from './table-node'

export type JoinTableNode = TableNode | AliasNode
export type JoinType = 'InnerJoin' | 'LeftJoin' | 'RightJoin' | 'FullJoin'
export type JoinNodeOnNode = FilterNode | AndNode | OrNode | ParensNode

export interface JoinNode extends OperationNode {
  readonly kind: 'JoinNode'
  readonly joinType: JoinType
  readonly table: JoinTableNode
  readonly on?: JoinNodeOnNode
}

export function isJoinNode(node: OperationNode): node is JoinNode {
  return node.kind === 'JoinNode'
}

export function createJoinNode(
  joinType: JoinType,
  table: JoinTableNode
): JoinNode {
  return freeze({
    kind: 'JoinNode',
    joinType,
    table,
    on: undefined,
  })
}

export function cloneJoinNodeWithOn(
  joinNode: JoinNode,
  op: 'and' | 'or',
  on: JoinNodeOnNode
): JoinNode {
  return freeze({
    ...joinNode,
    on: joinNode.on
      ? op === 'and'
        ? createAndNode(joinNode.on, on)
        : createOrNode(joinNode.on, on)
      : on,
  })
}
