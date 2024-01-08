import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface LimitNode extends OperationNode {
  readonly kind: 'LimitNode'
  readonly limit: OperationNode
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
