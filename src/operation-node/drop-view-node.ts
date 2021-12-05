import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'

export type DropViewNodeParams = Omit<Partial<DropViewNode>, 'kind' | 'name'>

export interface DropViewNode extends OperationNode {
  readonly kind: 'DropViewNode'
  readonly name: IdentifierNode
  readonly ifExists?: boolean
  readonly materialized?: boolean
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
      name: IdentifierNode.create(name),
    })
  },

  cloneWith(dropView: DropViewNode, params: DropViewNodeParams): DropViewNode {
    return freeze({
      ...dropView,
      ...params,
    })
  },
})
