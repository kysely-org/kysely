import { freeze } from '../utils/object-utils'
import { ColumnNode } from './column-node'
import { OperationNode } from './operation-node'
import { OperatorNode } from './operator-node'
import { PrimitiveValueListNode } from './primitive-value-list-node'
import { QueryNode } from './query-node'
import { RawNode } from './raw-node'
import { ReferenceNode } from './reference-node'
import { ValueListNode } from './value-list-node'
import { ValueNode } from './value-node'

export type FilterNodeLhsNode = ColumnNode | ReferenceNode | QueryNode | RawNode
export type FilterOperatorNode = OperatorNode | RawNode
export type FilterNodeRhsNode =
  | ValueNode
  | ValueListNode
  | PrimitiveValueListNode
  | FilterNodeLhsNode

export interface FilterNode extends OperationNode {
  readonly kind: 'FilterNode'
  readonly lhs?: FilterNodeLhsNode
  readonly op: OperatorNode | RawNode
  readonly rhs: FilterNodeRhsNode
}

export function isFilterNode(node: OperationNode): node is FilterNode {
  return node.kind === 'FilterNode'
}

export function createFilterNode(
  lhs: FilterNodeLhsNode | undefined,
  op: OperatorNode | RawNode,
  rhs: FilterNodeRhsNode
): FilterNode {
  return freeze({
    kind: 'FilterNode',
    lhs,
    op,
    rhs,
  })
}
