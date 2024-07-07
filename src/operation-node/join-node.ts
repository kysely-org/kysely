import { freeze } from '../util/object-utils.js'
import { OnNode } from './on-node.js'
import { OperationNode } from './operation-node.js'

export type JoinType =
  | 'InnerJoin'
  | 'LeftJoin'
  | 'RightJoin'
  | 'FullJoin'
  | 'LateralInnerJoin'
  | 'LateralLeftJoin'
  | 'Using'
  | 'OuterApply'

export interface JoinNode extends OperationNode {
  readonly kind: 'JoinNode'
  readonly joinType: JoinType
  readonly table: OperationNode
  readonly on?: OnNode
}

/**
 * @internal
 */
export const JoinNode = freeze({
  is(node: OperationNode): node is JoinNode {
    return node.kind === 'JoinNode'
  },

  create(joinType: JoinType, table: OperationNode): JoinNode {
    return freeze({
      kind: 'JoinNode',
      joinType,
      table,
      on: undefined,
    })
  },

  createWithOn(
    joinType: JoinType,
    table: OperationNode,
    on: OperationNode,
  ): JoinNode {
    return freeze({
      kind: 'JoinNode',
      joinType,
      table,
      on: OnNode.create(on),
    })
  },

  cloneWithOn(joinNode: JoinNode, operation: OperationNode): JoinNode {
    return freeze({
      ...joinNode,
      on: joinNode.on
        ? OnNode.cloneWithOperation(joinNode.on, 'And', operation)
        : OnNode.create(operation),
    })
  },
})
