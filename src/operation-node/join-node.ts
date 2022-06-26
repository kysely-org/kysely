import { freeze } from '../util/object-utils.js'
import { AliasNode } from './alias-node.js'
import { OnNode } from './on-node.js'
import { FilterExpressionNode } from './operation-node-utils.js'
import { OperationNode } from './operation-node.js'
import { TableNode } from './table-node.js'

export type JoinTableNode = TableNode | AliasNode
export type JoinType =
  | 'InnerJoin'
  | 'LeftJoin'
  | 'RightJoin'
  | 'FullJoin'
  | 'LateralInnerJoin'
  | 'LateralLeftJoin'

export interface JoinNode extends OperationNode {
  readonly kind: 'JoinNode'
  readonly joinType: JoinType
  readonly table: JoinTableNode
  readonly on?: OnNode
}

/**
 * @internal
 */
export const JoinNode = freeze({
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

  createWithOn(
    joinType: JoinType,
    table: JoinTableNode,
    on: FilterExpressionNode
  ): JoinNode {
    return freeze({
      kind: 'JoinNode',
      joinType,
      table,
      on: OnNode.create(on),
    })
  },

  cloneWithOn(joinNode: JoinNode, filter: FilterExpressionNode): JoinNode {
    return freeze({
      ...joinNode,
      on: joinNode.on
        ? OnNode.cloneWithFilter(joinNode.on, 'And', filter)
        : OnNode.create(filter),
    })
  },

  cloneWithOrOn(joinNode: JoinNode, filter: FilterExpressionNode): JoinNode {
    return freeze({
      ...joinNode,
      on: joinNode.on
        ? OnNode.cloneWithFilter(joinNode.on, 'Or', filter)
        : OnNode.create(filter),
    })
  },
})
