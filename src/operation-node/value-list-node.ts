import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface ValueListNode extends OperationNode {
  readonly kind: 'ValueListNode'
  readonly values: ReadonlyArray<OperationNode>
}

/**
 * @internal
 */
export const ValueListNode = freeze({
  is(node: OperationNode): node is ValueListNode {
    return node.kind === 'ValueListNode'
  },

  create(values: ReadonlyArray<OperationNode>): ValueListNode {
    return freeze({
      kind: 'ValueListNode',
      values: freeze(values),
    })
  },
})
