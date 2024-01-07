import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { TableNode } from './table-node.js'
import { IdentifierNode } from './identifier-node.js'
import { QueryNode } from './query-node.js'
import { TriggerEventNode } from './trigger-event-node.js'
import { TriggerOrderNode } from './trigger-order-node.js'
import { FunctionNode } from './function-node.js'

export type TriggerTime = 'after' | 'before' | 'instead of'

export type CreateTriggerNodeParams = Omit<
  CreateTriggerNode,
  'kind' | 'name' | 'queries'
>

export interface CreateTriggerNode extends OperationNode {
  readonly kind: 'CreateTriggerNode'
  readonly name: IdentifierNode
  readonly queries?: ReadonlyArray<QueryNode>
  readonly function?: FunctionNode
  readonly time?: TriggerTime
  readonly events?: ReadonlyArray<TriggerEventNode>
  readonly table?: TableNode
  readonly orReplace?: boolean
  readonly ifNotExists?: boolean
  readonly when?: OperationNode
  readonly temporary?: boolean
  readonly forEach?: 'row' | 'statement'
  readonly order?: TriggerOrderNode
}

/**
 * @internal
 */
export const CreateTriggerNode = freeze({
  is(node: OperationNode): node is CreateTriggerNode {
    return node.kind === 'CreateTriggerNode'
  },

  create(name: IdentifierNode): CreateTriggerNode {
    return freeze({
      kind: 'CreateTriggerNode',
      name,
    })
  },

  cloneWithQuery(
    createTrigger: CreateTriggerNode,
    query: QueryNode
  ): CreateTriggerNode {
    return freeze({
      ...createTrigger,
      queries: freeze([...(createTrigger.queries || []), query]),
    })
  },

  cloneWithEvent(
    createTrigger: CreateTriggerNode,
    event: TriggerEventNode
  ): CreateTriggerNode {
    return freeze({
      ...createTrigger,
      events: freeze([...(createTrigger.events || []), event]),
    })
  },

  cloneWith(
    createTrigger: CreateTriggerNode,
    params: CreateTriggerNodeParams
  ): CreateTriggerNode {
    return freeze({
      ...createTrigger,
      ...params,
    })
  },
})
