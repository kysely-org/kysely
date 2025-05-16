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
  readonly cascade?: boolean
}

type DropIndexNodeFactory = Readonly<{
  is(node: OperationNode): node is DropIndexNode
  create(name: string, params?: DropIndexNodeProps): Readonly<DropIndexNode>
  cloneWith(
    dropIndex: DropIndexNode,
    props: DropIndexNodeProps,
  ): Readonly<DropIndexNode>
}>

/**
 * @internal
 */
export const DropIndexNode: DropIndexNodeFactory = freeze<DropIndexNodeFactory>(
  {
    is(node): node is DropIndexNode {
      return node.kind === 'DropIndexNode'
    },

    create(name, params?) {
      return freeze({
        kind: 'DropIndexNode',
        name: SchemableIdentifierNode.create(name),
        ...params,
      })
    },

    cloneWith(dropIndex, props) {
      return freeze({
        ...dropIndex,
        ...props,
      })
    },
  },
)
