import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'
import type { OperationNode } from './operation-node.js'

export interface CollateNode extends OperationNode {
  readonly kind: 'CollateNode'
  readonly collation: IdentifierNode
}

type CollateNodeFactory = Readonly<{
  is(node: OperationNode): node is CollateNode
  create(collation: string): Readonly<CollateNode>
}>

/**
 * @internal
 */
export const CollateNode: CollateNodeFactory = freeze<CollateNodeFactory>({
  is(node): node is CollateNode {
    return node.kind === 'CollateNode'
  },

  create(collation) {
    return freeze({
      kind: 'CollateNode',
      collation: IdentifierNode.create(collation),
    })
  },
})
