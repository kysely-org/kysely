import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'
import { TableNode } from './table-node.js'

export type DropIndexNodeProps = Omit<DropIndexNode, 'kind' | 'name'>

export interface DropIndexNode extends OperationNode {
  readonly kind: 'DropIndexNode'
  readonly name: IdentifierNode
  readonly table?: TableNode
  readonly ifExists?: boolean
}

/**
 * @internal
 */
export const DropIndexNode = freeze({
  is(node: OperationNode): node is DropIndexNode {
    return node.kind === 'DropIndexNode'
  },

  create(name: string, params?: DropIndexNodeProps): DropIndexNode {
    return freeze({
      kind: 'DropIndexNode',
      name: IdentifierNode.create(name),
      ...params,
    })
  },

  cloneWith(
    dropIndex: DropIndexNode,
    props: DropIndexNodeProps
  ): DropIndexNode {
    return freeze({
      ...dropIndex,
      ...props,
    })
  },
})
