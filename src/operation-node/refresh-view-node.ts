import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { SchemableIdentifierNode } from './schemable-identifier-node.js'

export type RefreshMaterializedViewNodeParams = Omit<
  Partial<RefreshMaterializedViewNode>,
  'kind' | 'name'
>

export interface RefreshMaterializedViewNode extends OperationNode {
  readonly kind: 'RefreshMaterializedViewNode'
  readonly name: SchemableIdentifierNode
  readonly concurrently?: boolean
  readonly withNoData?: boolean
}

/**
 * @internal
 */
export const RefreshMaterializedViewNode = freeze({
  is(node: OperationNode): node is RefreshMaterializedViewNode {
    return node.kind === 'RefreshMaterializedViewNode'
  },

  create(name: string): RefreshMaterializedViewNode {
    return freeze({
      kind: 'RefreshMaterializedViewNode',
      name: SchemableIdentifierNode.create(name),
    })
  },

  cloneWith(
    createView: RefreshMaterializedViewNode,
    params: RefreshMaterializedViewNodeParams,
  ): RefreshMaterializedViewNode {
    return freeze({
      ...createView,
      ...params,
    })
  },
})
