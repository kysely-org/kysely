import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'
import { RawNode } from './raw-node.js'

export type AddIndexNodeProps = Omit<AddIndexNode, 'kind' | 'name'>

export interface AddIndexNode extends OperationNode {
  readonly kind: 'AddIndexNode'
  readonly name: IdentifierNode
  readonly columns?: OperationNode[]
  readonly unique?: boolean
  readonly using?: RawNode
  readonly ifNotExists?: boolean
}

/**
 * @internal
 */
export const AddIndexNode = freeze({
  is(node: OperationNode): node is AddIndexNode {
    return node.kind === 'AddIndexNode'
  },

  create(name: string): AddIndexNode {
    return freeze({
      kind: 'AddIndexNode',
      name: IdentifierNode.create(name),
    })
  },

  cloneWith(node: AddIndexNode, props: AddIndexNodeProps): AddIndexNode {
    return freeze({
      ...node,
      ...props,
    })
  },

  cloneWithColumns(node: AddIndexNode, columns: OperationNode[]): AddIndexNode {
    return freeze({
      ...node,
      columns: [...(node.columns || []), ...columns],
    })
  },
})
