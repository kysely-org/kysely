import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { RawNode } from './raw-node.js'
import { SelectQueryNode } from './select-query-node.js'

export type UnionExpressionNode = SelectQueryNode | RawNode

export interface UnionNode extends OperationNode {
  readonly kind: 'UnionNode'
  readonly union: UnionExpressionNode
  readonly all: boolean
}

/**
 * @internal
 */
export const UnionNode = freeze({
  is(node: OperationNode): node is UnionNode {
    return node.kind === 'UnionNode'
  },

  create(union: UnionExpressionNode, all: boolean): UnionNode {
    return freeze({
      kind: 'UnionNode',
      union,
      all,
    })
  },
})
