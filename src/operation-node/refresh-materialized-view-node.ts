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

type RefreshMaterializedViewNodeFactory = Readonly<{
  is(node: OperationNode): node is RefreshMaterializedViewNode
  create(name: string): Readonly<RefreshMaterializedViewNode>
  cloneWith(
    createView: RefreshMaterializedViewNode,
    params: RefreshMaterializedViewNodeParams,
  ): Readonly<RefreshMaterializedViewNode>
}>

/**
 * @internal
 */
export const RefreshMaterializedViewNode: RefreshMaterializedViewNodeFactory =
  freeze<RefreshMaterializedViewNodeFactory>({
    is(node): node is RefreshMaterializedViewNode {
      return node.kind === 'RefreshMaterializedViewNode'
    },

    create(name) {
      return freeze({
        kind: 'RefreshMaterializedViewNode',
        name: SchemableIdentifierNode.create(name),
      })
    },

    cloneWith(createView, params) {
      return freeze({
        ...createView,
        ...params,
      })
    },
  })
