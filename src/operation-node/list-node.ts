import { freeze } from '../util/object-utils'
import { OperationNode } from './operation-node'

export interface ListNode extends OperationNode {
  readonly kind: 'ListNode'
  readonly items: ReadonlyArray<OperationNode>
}

export const listNode = freeze({
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
