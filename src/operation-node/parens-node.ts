import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { FilterExpressionNode } from './operation-node-utils.js'

export interface ParensNode extends OperationNode {
  readonly kind: 'ParensNode'
  readonly node: FilterExpressionNode
}

/**
 * @internal
 */
export const parensNode = freeze({
  is(node: OperationNode): node is ParensNode {
    return node.kind === 'ParensNode'
  },

  create(node: FilterExpressionNode): ParensNode {
    return freeze({
      kind: 'ParensNode',
      node,
    })
  },
})
