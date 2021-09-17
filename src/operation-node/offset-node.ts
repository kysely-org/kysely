import { freeze } from '../util/object-utils'
import { OperationNode } from './operation-node'
import { valueNode, ValueNode } from './value-node'

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
