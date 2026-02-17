import { freeze } from '../util/object-utils.js'
import type { IdentifierNode } from './identifier-node.js'
import type { OperationNode } from './operation-node.js'
import type { SchemableIdentifierNode } from './schemable-identifier-node.js'
import type { ValueNode } from './value-node.js'

export type AlterTypeNodeParams = Omit<
  Partial<AlterTypeNode>,
  'kind' | 'name'
>

export interface AlterTypeNode extends OperationNode {
  readonly kind: 'AlterTypeNode'
  readonly name: SchemableIdentifierNode
  readonly renameTo?: IdentifierNode
  readonly setSchema?: IdentifierNode
  readonly addValue?: ValueNode
  readonly renameValue?: {
    readonly oldName: ValueNode
    readonly newName: ValueNode
  }
}

type AlterTypeNodeFactory = Readonly<{
  is(node: OperationNode): node is AlterTypeNode
  create(name: SchemableIdentifierNode): Readonly<AlterTypeNode>
  cloneWith(
    node: AlterTypeNode,
    params: AlterTypeNodeParams,
  ): Readonly<AlterTypeNode>
}>

/**
 * @internal
 */
export const AlterTypeNode: AlterTypeNodeFactory =
  freeze<AlterTypeNodeFactory>({
    is(node): node is AlterTypeNode {
      return node.kind === 'AlterTypeNode'
    },

    create(name) {
      return freeze({
        kind: 'AlterTypeNode',
        name,
      })
    },

    cloneWith(node, params) {
      return freeze({
        ...node,
        ...params,
      })
    },
  })
