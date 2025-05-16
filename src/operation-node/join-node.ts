import { freeze } from '../util/object-utils.js'
import { OnNode } from './on-node.js'
import { OperationNode } from './operation-node.js'

export type JoinType =
  | 'InnerJoin'
  | 'LeftJoin'
  | 'RightJoin'
  | 'FullJoin'
  | 'CrossJoin'
  | 'LateralInnerJoin'
  | 'LateralLeftJoin'
  | 'LateralCrossJoin'
  | 'Using'
  | 'OuterApply'
  | 'CrossApply'

export interface JoinNode extends OperationNode {
  readonly kind: 'JoinNode'
  readonly joinType: JoinType
  readonly table: OperationNode
  readonly on?: OnNode
}

type JoinNodeFactory = Readonly<{
  is(node: OperationNode): node is JoinNode
  create(joinType: JoinType, table: OperationNode): Readonly<JoinNode>
  createWithOn(
    joinType: JoinType,
    table: OperationNode,
    on: OperationNode,
  ): Readonly<JoinNode>
  cloneWithOn(joinNode: JoinNode, operation: OperationNode): Readonly<JoinNode>
}>

/**
 * @internal
 */
export const JoinNode: JoinNodeFactory = freeze<JoinNodeFactory>({
  is(node): node is JoinNode {
    return node.kind === 'JoinNode'
  },

  create(joinType, table) {
    return freeze({
      kind: 'JoinNode',
      joinType,
      table,
      on: undefined,
    })
  },

  createWithOn(joinType, table, on) {
    return freeze({
      kind: 'JoinNode',
      joinType,
      table,
      on: OnNode.create(on),
    })
  },

  cloneWithOn(joinNode, operation) {
    return freeze({
      ...joinNode,
      on: joinNode.on
        ? OnNode.cloneWithOperation(joinNode.on, 'And', operation)
        : OnNode.create(operation),
    })
  },
})
