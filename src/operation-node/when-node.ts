import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'

export interface WhenNode extends OperationNode {
  readonly kind: 'WhenNode'
  readonly condition: OperationNode
  readonly result?: OperationNode
}

type WhenNodeFactory = Readonly<{
  is(node: OperationNode): node is WhenNode
  create(condition: OperationNode): Readonly<WhenNode>
  cloneWithResult(whenNode: WhenNode, result: OperationNode): Readonly<WhenNode>
}>

/**
 * @internal
 */
export const WhenNode: WhenNodeFactory = freeze<WhenNodeFactory>({
  is(node): node is WhenNode {
    return node.kind === 'WhenNode'
  },

  create(condition) {
    return freeze({
      kind: 'WhenNode',
      condition,
    })
  },

  cloneWithResult(whenNode, result) {
    return freeze({
      ...whenNode,
      result,
    })
  },
})
