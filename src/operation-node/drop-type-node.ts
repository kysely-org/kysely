import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { SchemableIdentifierNode } from './schemable-identifier-node.js'

export type DropTypeNodeParams = Omit<Partial<DropTypeNode>, 'kind' | 'names'>

export interface DropTypeNode extends OperationNode {
  readonly kind: 'DropTypeNode'
  readonly names: SchemableIdentifierNode[]
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

  create(names: SchemableIdentifierNode[]): DropTypeNode {
    return freeze({
      kind: 'DropTypeNode',
      names,
    })
  },

  cloneWith(dropType: DropTypeNode, params: DropTypeNodeParams): DropTypeNode {
    return freeze({
      ...dropType,
      ...params,
    })
  },
})
