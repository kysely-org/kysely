import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { SchemableIdentifierNode } from './schemable-identifier-node.js'

export type DropTriggerNodeParams = Omit<
  Partial<DropTriggerNode>,
  'kind' | 'name'
>
export interface DropTriggerNode extends OperationNode {
  readonly kind: 'DropTriggerNode'
  readonly name: SchemableIdentifierNode
  readonly ifExists?: boolean
  readonly cascade?: boolean
}

/**
 * @internal
 */
export const DropTriggerNode = freeze({
  is(node: OperationNode): node is DropTriggerNode {
    return node.kind === 'DropTriggerNode'
  },

  create(name: SchemableIdentifierNode): DropTriggerNode {
    return freeze({
      kind: 'DropTriggerNode',
      name,
    })
  },

  cloneWith(
    dropTrigger: DropTriggerNode,
    params: DropTriggerNodeParams
  ): DropTriggerNode {
    return freeze({
      ...dropTrigger,
      ...params,
    })
  },
})
