import { freeze } from '../util/object-utils.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'

export interface CollateNode extends OperationNode {
  readonly kind: 'CollateNode'
  readonly collation: IdentifierNode
}

/**
 * @internal
 */
export const CollateNode = {
  is(node: OperationNode): node is CollateNode {
    return node.kind === 'CollateNode'
  },

  create(collation: string): CollateNode {
    return freeze({
      kind: 'CollateNode',
      collation: IdentifierNode.create(collation),
    })
  },
}
