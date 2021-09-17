import { freeze } from '../util/object-utils'
import { ColumnNode } from './column-node'
import { IdentifierNode, identifierNode } from './identifier-node'
import { ListNode } from './list-node'
import { OperationNode } from './operation-node'
import { RawNode } from './raw-node'
import { TableNode } from './table-node'

export type CreateIndexNodeParams = Omit<Partial<CreateIndexNode>, 'kind'>
export type IndexType = 'btree' | 'hash' | 'gist' | 'gin'

export interface CreateIndexNode extends OperationNode {
  readonly kind: 'CreateIndexNode'
  readonly name: IdentifierNode
  readonly on?: TableNode
  readonly expression?: ColumnNode | ListNode | RawNode
  readonly unique?: boolean
  // TODO(samiko): Implemented as a raw node because I'm lazy today.
  readonly using?: RawNode
}

/**
 * @internal
 */
export const createIndexNode = freeze({
  is(node: OperationNode): node is CreateIndexNode {
    return node.kind === 'CreateIndexNode'
  },

  create(name: string): CreateIndexNode {
    return freeze({
      kind: 'CreateIndexNode',
      name: identifierNode.create(name),
    })
  },

  cloneWith(
    node: CreateIndexNode,
    params: CreateIndexNodeParams
  ): CreateIndexNode {
    return freeze({
      ...node,
      ...params,
    })
  },
})
