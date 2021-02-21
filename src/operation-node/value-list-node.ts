import { freeze } from '../utils/object-utils'
import { OperationNode } from './operation-node'
import { QueryNode } from './query-node'
import { RawNode } from './raw-node'
import { ReferenceNode } from './reference-node'
import { ValueNode } from './value-node'

export type ListNodeItem = ValueNode | ReferenceNode | QueryNode | RawNode

export interface ValueListNode extends OperationNode {
  readonly kind: 'ValueListNode'
  readonly values: ReadonlyArray<ListNodeItem>
}

export function isValueListNode(node: OperationNode): node is ValueListNode {
  return node.kind === 'ValueListNode'
}

export function createValueListNode(
  values: ReadonlyArray<ListNodeItem>
): ValueListNode {
  return freeze({
    kind: 'ValueListNode',
    values: freeze(values),
  })
}
