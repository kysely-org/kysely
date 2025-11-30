import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'
import type { OperationNode } from './operation-node.js'
import type { RawNode } from './raw-node.js'
import type { TableNode } from './table-node.js'
import type { WhereNode } from './where-node.js'

export type CreateIndexNodeProps = Omit<CreateIndexNode, 'kind' | 'name'>
export type IndexType = 'btree' | 'hash' | 'gist' | 'gin'

export interface CreateIndexNode extends OperationNode {
  readonly kind: 'CreateIndexNode'
  // This isn't and shouldn't be a `SchemableIdentifier`. Postgres doesn't
  // allow explicit schema for create index query. The schema is always the
  // same as the target table's schema.
  readonly name: IdentifierNode
  readonly table?: TableNode
  readonly columns?: OperationNode[]
  readonly unique?: boolean
  // TODO(samiko): Do we need to add an `IndexTypeNode` for consistency?
  //               This would then be of type `IndexTypeNode | RawNode`.
  readonly using?: RawNode
  readonly ifNotExists?: boolean
  readonly where?: WhereNode
  readonly nullsNotDistinct?: boolean
}

type CreateIndexNodeFactory = Readonly<{
  is(node: OperationNode): node is CreateIndexNode
  create(name: string): Readonly<CreateIndexNode>
  cloneWith(
    node: CreateIndexNode,
    props: CreateIndexNodeProps,
  ): Readonly<CreateIndexNode>
  cloneWithColumns(
    node: CreateIndexNode,
    columns: OperationNode[],
  ): Readonly<CreateIndexNode>
}>

/**
 * @internal
 */
export const CreateIndexNode: CreateIndexNodeFactory =
  freeze<CreateIndexNodeFactory>({
    is(node): node is CreateIndexNode {
      return node.kind === 'CreateIndexNode'
    },

    create(name) {
      return freeze({
        kind: 'CreateIndexNode',
        name: IdentifierNode.create(name),
      })
    },

    cloneWith(node, props) {
      return freeze({
        ...node,
        ...props,
      })
    },

    cloneWithColumns(node, columns) {
      return freeze({
        ...node,
        columns: [...(node.columns || []), ...columns],
      })
    },
  })
