import { freeze } from '../util/object-utils'
import { AliasNode } from './alias-node'
import { AndNode, andNode } from './and-node'
import { FilterNode } from './filter-node'
import { OperationNode } from './operation-node'
import { OrNode, orNode } from './or-node'
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

/**
 * @internal
 */
export const joinNode = freeze({
  is(node: OperationNode): node is JoinNode {
    return node.kind === 'JoinNode'
  },

  create(joinType: JoinType, table: JoinTableNode): JoinNode {
    return freeze({
      kind: 'JoinNode',
      joinType,
      table,
      on: undefined,
    })
  },

  cloneWithOn(
    joinNode: JoinNode,
    op: 'and' | 'or',
    on: JoinNodeOnNode
  ): JoinNode {
    return freeze({
      ...joinNode,
      on: joinNode.on
        ? op === 'and'
          ? andNode.create(joinNode.on, on)
          : orNode.create(joinNode.on, on)
        : on,
    })
  },
})
