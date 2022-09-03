import { freeze } from '../util/object-utils.js'
import { DefaultInsertValueNode } from './default-insert-value-node.js'
import { OperationNode } from './operation-node.js'
import { RawNode } from './raw-node.js'
import { ReferenceNode } from './reference-node.js'
import { SelectQueryNode } from './select-query-node.js'
import { ValueNode } from './value-node.js'

export type ListNodeItem =
  | ValueNode
  | ReferenceNode
  | DefaultInsertValueNode
  | SelectQueryNode
  | RawNode

export interface ValueListNode extends OperationNode {
  readonly kind: 'ValueListNode'
  readonly values: ReadonlyArray<ListNodeItem>
}

/**
 * @internal
 */
export const ValueListNode = freeze({
  is(node: OperationNode): node is ValueListNode {
    return node.kind === 'ValueListNode'
  },

  create(values: ReadonlyArray<ListNodeItem>): ValueListNode {
    return freeze({
      kind: 'ValueListNode',
      values: freeze(values),
    })
  },
})
