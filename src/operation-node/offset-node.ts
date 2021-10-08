import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { ValueNode } from './value-node.js'

export interface OffsetNode extends OperationNode {
  readonly kind: 'OffsetNode'
  readonly offset: ValueNode
}

/**
 * @internal
 */
export const OffsetNode = freeze({
  is(node: OperationNode): node is OffsetNode {
    return node.kind === 'OffsetNode'
  },

  create(offset: number): OffsetNode {
    return freeze({
      kind: 'OffsetNode',
      offset: ValueNode.create(offset),
    })
  },
})
