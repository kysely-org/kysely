import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { SchemableIdentifierNode } from './schemable-identifier-node.js'

export type DropTypeNodeParams = Omit<Partial<DropTypeNode>, 'kind' | 'name'>

export interface DropTypeNode extends OperationNode {
  readonly kind: 'DropTypeNode'
  readonly name: SchemableIdentifierNode
  readonly ifExists?: boolean
}

type DropTypeNodeFactory = Readonly<{
  is(node: OperationNode): node is DropTypeNode
  create(name: SchemableIdentifierNode): Readonly<DropTypeNode>
  cloneWith(
    dropType: DropTypeNode,
    params: DropTypeNodeParams,
  ): Readonly<DropTypeNode>
}>

/**
 * @internal
 */
export const DropTypeNode: DropTypeNodeFactory = freeze<DropTypeNodeFactory>({
  is(node): node is DropTypeNode {
    return node.kind === 'DropTypeNode'
  },

  create(name) {
    return freeze({
      kind: 'DropTypeNode',
      name,
    })
  },

  cloneWith(dropType, params) {
    return freeze({
      ...dropType,
      ...params,
    })
  },
})
