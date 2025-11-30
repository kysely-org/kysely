import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'

export interface AliasNode extends OperationNode {
  readonly kind: 'AliasNode'
  readonly node: OperationNode
  readonly alias: OperationNode
}

type AliasNodeFactory = Readonly<{
  is(node: OperationNode): node is AliasNode
  create(node: OperationNode, alias: OperationNode): Readonly<AliasNode>
}>

/**
 * @internal
 */
export const AliasNode: AliasNodeFactory = freeze<AliasNodeFactory>({
  is(node): node is AliasNode {
    return node.kind === 'AliasNode'
  },

  create(node, alias) {
    return freeze({
      kind: 'AliasNode',
      node,
      alias,
    })
  },
})
