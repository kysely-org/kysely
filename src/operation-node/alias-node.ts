import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface AliasNode extends OperationNode {
  readonly kind: 'AliasNode'
  readonly node: OperationNode
  readonly alias: OperationNode
}

/**
 * @internal
 */
export const AliasNode = freeze({
  is(node: OperationNode): node is AliasNode {
    return node.kind === 'AliasNode'
  },

  create(node: OperationNode, alias: OperationNode): AliasNode {
    return freeze({
      kind: 'AliasNode',
      node,
      alias,
    })
  },
})
