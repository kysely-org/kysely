import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'

export interface ParensNode extends OperationNode {
  readonly kind: 'ParensNode'
  readonly node: OperationNode
}

/**
 * @internal
 */
export const ParensNode = freeze({
  is(node: OperationNode): node is ParensNode {
    return node.kind === 'ParensNode'
  },

  create(node: OperationNode): ParensNode {
    return freeze({
      kind: 'ParensNode',
      node,
    })
  },
})
