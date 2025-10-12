import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { SchemableIdentifierNode } from './schemable-identifier-node.js'

export type DropTypeNodeParams = Omit<
  Partial<DropTypeNode>,
  'kind' | 'name' | 'additionalNames'
>

export interface DropTypeNode extends OperationNode {
  readonly kind: 'DropTypeNode'
  readonly name: SchemableIdentifierNode
  readonly additionalNames?: SchemableIdentifierNode[]
  readonly ifExists?: boolean
  readonly cascade?: boolean
}

type DropTypeNodeFactory = Readonly<{
  is(node: OperationNode): node is DropTypeNode
  create(
    names: SchemableIdentifierNode | SchemableIdentifierNode[],
  ): Readonly<DropTypeNode>
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

  create(names) {
    if (!Array.isArray(names)) {
      names = [names]
    }

    return freeze({
      kind: 'DropTypeNode',
      name: names[0],
      additionalNames: names.slice(1),
    })
  },

  cloneWith(dropType, params) {
    return freeze({
      ...dropType,
      ...params,
    })
  },
})
