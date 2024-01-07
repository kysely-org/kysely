import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export type TriggerEvent = 'delete' | 'update' | 'insert' | 'truncate'

export type TriggerEventNodeParams = Omit<TriggerEventNode, 'kind'>

export interface TriggerEventNode extends OperationNode {
  readonly kind: 'TriggerEventNode'
  readonly event: TriggerEvent
  readonly columns?: ReadonlyArray<OperationNode>
}

/**
 * @internal
 */
export const TriggerEventNode = freeze({
  is(node: OperationNode): node is TriggerEventNode {
    return node.kind === 'TriggerEventNode'
  },

  create(
    event: TriggerEvent,
    columns?: ReadonlyArray<OperationNode>
  ): TriggerEventNode {
    return freeze({
      kind: 'TriggerEventNode',
      event,
      columns,
    })
  },
})
