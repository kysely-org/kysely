import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { SchemableIdentifierNode } from './schemable-identifier-node.js'
import { TableNode } from './table-node.js'

export type DropIndexNodeProps = Omit<DropIndexNode, 'kind' | 'name'>

export interface DropIndexNode extends OperationNode {
  readonly kind: 'DropIndexNode'
  readonly name: SchemableIdentifierNode
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
      name: SchemableIdentifierNode.create(name),
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
