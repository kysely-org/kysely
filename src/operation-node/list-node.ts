import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface ListNode extends OperationNode {
  readonly kind: 'ListNode'
  readonly items: ReadonlyArray<OperationNode>
}

/**
 * @internal
 */
export const ListNode = freeze({
  is(node: OperationNode): node is ListNode {
    return node.kind === 'ListNode'
  },

  create(items: ReadonlyArray<OperationNode>): ListNode {
    return freeze({
      kind: 'ListNode',
      items: freeze(items),
    })
  },
})
