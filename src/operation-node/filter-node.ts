import { freeze } from '../utils/object-utils'
import { OperationNode } from './operation-node'
import {
  ReferenceExpressionNode,
  ValueExpressionNode,
} from './operation-node-utils'
import { OperatorNode } from './operator-node'
import { RawNode } from './raw-node'

export type FilterOperatorNode = OperatorNode | RawNode

export interface FilterNode extends OperationNode {
  readonly kind: 'FilterNode'
  readonly lhs?: ReferenceExpressionNode
  readonly op: OperatorNode | RawNode
  readonly rhs: ValueExpressionNode
}

export function isFilterNode(node: OperationNode): node is FilterNode {
  return node.kind === 'FilterNode'
}

export function createFilterNode(
  lhs: ReferenceExpressionNode | undefined,
  op: OperatorNode | RawNode,
  rhs: ValueExpressionNode
): FilterNode {
  return freeze({
    kind: 'FilterNode',
    lhs,
    op,
    rhs,
  })
}
