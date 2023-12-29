import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { ValueNode } from './value-node.js'

export interface LimitNode extends OperationNode {
  readonly kind: 'LimitNode'
  readonly limit: ValueNode
}

/**
 * @internal
 */
export const LimitNode = freeze({
  is(node: OperationNode): node is LimitNode {
    return node.kind === 'LimitNode'
  },

  create(rowCount: number | bigint): LimitNode {
    return freeze({
      kind: 'LimitNode',
      limit: ValueNode.create(rowCount),
    })
  },
})
