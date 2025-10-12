import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'
import { RawNode } from './raw-node.js'

export interface AddIndexNode extends OperationNode {
  readonly kind: 'AddIndexNode'
  readonly name: IdentifierNode
  readonly columns?: OperationNode[]
  readonly unique?: boolean
  readonly using?: RawNode
  /**
   * @deprecated added by accident.
   */
  // TODO: remove in 0.30
  readonly ifNotExists?: boolean
}

type AddIndexNodeFactory = Readonly<{
  is(node: OperationNode): node is AddIndexNode
  create(name: string): Readonly<AddIndexNode>
  /**
   * @deprecated `ifNotExists` was added by accident.
   */
  // TODO: remove in 0.30
  cloneWith(
    node: AddIndexNode,
    props: Pick<AddIndexNode, 'ifNotExists'>,
  ): Readonly<AddIndexNode>
  cloneWith(
    node: AddIndexNode,
    props: Omit<AddIndexNode, 'kind' | 'name' | 'ifNotExists'>,
  ): Readonly<AddIndexNode>
  cloneWithColumns(
    node: AddIndexNode,
    columns: OperationNode[],
  ): Readonly<AddIndexNode>
}>

/**
 * @internal
 */
export const AddIndexNode: AddIndexNodeFactory = freeze<AddIndexNodeFactory>({
  is(node): node is AddIndexNode {
    return node.kind === 'AddIndexNode'
  },

  create(name) {
    return freeze({
      kind: 'AddIndexNode',
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
