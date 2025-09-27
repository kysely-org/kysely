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
  readonly modifier?: 'cascade' | 'restrict'
}

/**
 * @internal
 */
export const DropTypeNode = freeze({
  is(node: OperationNode): node is DropTypeNode {
    return node.kind === 'DropTypeNode'
  },

  create(
    names: SchemableIdentifierNode | SchemableIdentifierNode[],
  ): DropTypeNode {
    if (!Array.isArray(names)) {
      names = [names]
    }

    return freeze({
      kind: 'DropTypeNode',
      name: names[0],
      additionalNames: names.slice(1),
    })
  },

  cloneWith(dropType: DropTypeNode, params: DropTypeNodeParams): DropTypeNode {
    return freeze({
      ...dropType,
      ...params,
    })
  },
})
