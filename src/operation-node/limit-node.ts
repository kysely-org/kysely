import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface LimitNode extends OperationNode {
  readonly kind: 'LimitNode'
  readonly limit: OperationNode
}

type LimitNodeFactory = Readonly<{
  is(node: OperationNode): node is LimitNode
  create(limit: OperationNode): Readonly<LimitNode>
}>

/**
 * @internal
 */
export const LimitNode: LimitNodeFactory = freeze<LimitNodeFactory>({
  is(node): node is LimitNode {
    return node.kind === 'LimitNode'
  },

  create(limit) {
    return freeze({
      kind: 'LimitNode',
      limit,
    })
  },
})
