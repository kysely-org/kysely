import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'

export type TriggerOrder = 'follows' | 'precedes'

export type TriggerOrderNodeParams = Omit<TriggerOrderNode, 'kind'>

export interface TriggerOrderNode extends OperationNode {
  readonly kind: 'TriggerOrderNode'
  readonly order: TriggerOrder
  readonly otherTriggerName: IdentifierNode
}

/**
 * @internal
 */
export const TriggerOrderNode = freeze({
  is(node: OperationNode): node is TriggerOrderNode {
    return node.kind === 'TriggerOrderNode'
  },

  create(
    order: TriggerOrder,
    otherTriggerName: IdentifierNode
  ): TriggerOrderNode {
    return freeze({
      kind: 'TriggerOrderNode',
      order,
      otherTriggerName,
    })
  },
})
