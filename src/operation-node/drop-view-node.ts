import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'
import { SchemableIdentifierNode } from './schemable-identifier-node.js'

export type DropViewNodeParams = Omit<Partial<DropViewNode>, 'kind' | 'name'>

export interface DropViewNode extends OperationNode {
  readonly kind: 'DropViewNode'
  readonly name: SchemableIdentifierNode
  readonly ifExists?: boolean
  readonly materialized?: boolean
  readonly cascade?: boolean
}

/**
 * @internal
 */
export const DropViewNode = freeze({
  is(node: OperationNode): node is DropViewNode {
    return node.kind === 'DropViewNode'
  },

  create(name: string): DropViewNode {
    return freeze({
      kind: 'DropViewNode',
      name: SchemableIdentifierNode.create(name),
    })
  },

  cloneWith(dropView: DropViewNode, params: DropViewNodeParams): DropViewNode {
    return freeze({
      ...dropView,
      ...params,
    })
  },
})
