import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface FilterNode extends OperationNode {
  readonly kind: 'FilterNode'
  readonly left?: OperationNode
  readonly op: OperationNode
  readonly right: OperationNode
}

/**
 * @internal
 */
export const FilterNode = freeze({
  is(node: OperationNode): node is FilterNode {
    return node.kind === 'FilterNode'
  },

  create(
    left: OperationNode | undefined,
    op: OperationNode,
    right: OperationNode
  ): FilterNode {
    return freeze({
      kind: 'FilterNode',
      left,
      op,
      right,
    })
  },
})
