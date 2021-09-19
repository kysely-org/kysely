import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { valueNode, ValueNode } from './value-node.js'

export interface LimitNode extends OperationNode {
  readonly kind: 'LimitNode'
  readonly limit: ValueNode
}

/**
 * @internal
 */
export const limitNode = freeze({
  is(node: OperationNode): node is LimitNode {
    return node.kind === 'LimitNode'
  },

  create(limit: number): LimitNode {
    return freeze({
      kind: 'LimitNode',
      limit: valueNode.create(limit),
    })
  },
})
