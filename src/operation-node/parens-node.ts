import { OperationNode } from './operation-node'
import { freeze } from '../util/object-utils'
import { FilterExpressionNode } from './operation-node-utils'

export interface ParensNode extends OperationNode {
  readonly kind: 'ParensNode'
  readonly node: FilterExpressionNode
}

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
