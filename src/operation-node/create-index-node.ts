import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { IdentifierNode } from './identifier-node.js'
import { ListNode } from './list-node.js'
import { OperationNode } from './operation-node.js'
import { RawNode } from './raw-node.js'
import { TableNode } from './table-node.js'

export type CreateIndexNodeProps = Omit<CreateIndexNode, 'kind' | 'name'>
export type IndexType = 'btree' | 'hash' | 'gist' | 'gin'

export interface CreateIndexNode extends OperationNode {
  readonly kind: 'CreateIndexNode'
  readonly name: IdentifierNode
  readonly table?: TableNode
  readonly expression?: ColumnNode | ListNode | RawNode
  readonly unique?: boolean
  // TODO(samiko): Do we need to add an `IndexTypeNode` for consistency?
  //               This would then be of type `IndexTypeNode | RawNode`.
  readonly using?: RawNode
}

/**
 * @internal
 */
export const CreateIndexNode = freeze({
  is(node: OperationNode): node is CreateIndexNode {
    return node.kind === 'CreateIndexNode'
  },

  create(name: string): CreateIndexNode {
    return freeze({
      kind: 'CreateIndexNode',
      name: IdentifierNode.create(name),
    })
  },

  cloneWith(
    node: CreateIndexNode,
    props: CreateIndexNodeProps
  ): CreateIndexNode {
    return freeze({
      ...node,
      ...props,
    })
  },
})
