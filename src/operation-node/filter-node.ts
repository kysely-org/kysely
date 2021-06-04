import { freeze } from '../util/object-utils'
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
  readonly left?: ReferenceExpressionNode
  readonly op: OperatorNode | RawNode
  readonly right: ValueExpressionNode
}

export function isFilterNode(node: OperationNode): node is FilterNode {
  return node.kind === 'FilterNode'
}

export function createFilterNode(
  left: ReferenceExpressionNode | undefined,
  op: OperatorNode | RawNode,
  right: ValueExpressionNode
): FilterNode {
  return freeze({
    kind: 'FilterNode',
    left,
    op,
    right,
  })
}
