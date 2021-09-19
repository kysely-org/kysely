import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { valueNode, ValueNode } from './value-node.js'

export interface OffsetNode extends OperationNode {
  readonly kind: 'OffsetNode'
  readonly offset: ValueNode
}

/**
 * @internal
 */
export const offsetNode = freeze({
  is(node: OperationNode): node is OffsetNode {
    return node.kind === 'OffsetNode'
  },

  create(offset: number): OffsetNode {
    return freeze({
      kind: 'OffsetNode',
      offset: valueNode.create(offset),
    })
  },
})
