import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface ListNode extends OperationNode {
  readonly kind: 'ListNode'
  readonly items: ReadonlyArray<OperationNode>
}

type ListNodeFactory = Readonly<{
  is(node: OperationNode): node is ListNode
  create(items: ReadonlyArray<OperationNode>): Readonly<ListNode>
}>

/**
 * @internal
 */
export const ListNode: ListNodeFactory = freeze<ListNodeFactory>({
  is(node): node is ListNode {
    return node.kind === 'ListNode'
  },

  create(items) {
    return freeze({
      kind: 'ListNode',
      items: freeze(items),
    })
  },
})
