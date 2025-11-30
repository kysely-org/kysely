import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'
import { SchemableIdentifierNode } from './schemable-identifier-node.js'

export type DropViewNodeParams = Omit<Partial<DropViewNode>, 'kind' | 'name'>

export interface DropViewNode extends OperationNode {
  readonly kind: 'DropViewNode'
  readonly name: SchemableIdentifierNode
  readonly ifExists?: boolean
  readonly materialized?: boolean
  readonly cascade?: boolean
}

type DropViewNodeFactory = Readonly<{
  is(node: OperationNode): node is DropViewNode
  create(name: string): Readonly<DropViewNode>
  cloneWith(
    dropView: DropViewNode,
    params: DropViewNodeParams,
  ): Readonly<DropViewNode>
}>

/**
 * @internal
 */
export const DropViewNode: DropViewNodeFactory = freeze<DropViewNodeFactory>({
  is(node): node is DropViewNode {
    return node.kind === 'DropViewNode'
  },

  create(name) {
    return freeze({
      kind: 'DropViewNode',
      name: SchemableIdentifierNode.create(name),
    })
  },

  cloneWith(dropView, params) {
    return freeze({
      ...dropView,
      ...params,
    })
  },
})
