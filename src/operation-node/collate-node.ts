import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface CollateNode extends OperationNode {
  readonly kind: 'CollateNode'
  readonly collation: string
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
      collation,
    })
  },
}
