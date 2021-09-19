import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import {
  ReferenceExpressionNode,
  ValueExpressionNode,
} from './operation-node-utils.js'
import { OperatorNode } from './operator-node.js'
import { RawNode } from './raw-node.js'

export type FilterOperatorNode = OperatorNode | RawNode

export interface FilterNode extends OperationNode {
  readonly kind: 'FilterNode'
  readonly left?: ReferenceExpressionNode
  readonly op: OperatorNode | RawNode
  readonly right: ValueExpressionNode
}

/**
 * @internal
 */
export const filterNode = freeze({
  is(node: OperationNode): node is FilterNode {
    return node.kind === 'FilterNode'
  },

  create(
    left: ReferenceExpressionNode | undefined,
    op: OperatorNode | RawNode,
    right: ValueExpressionNode
  ): FilterNode {
    return freeze({
      kind: 'FilterNode',
      left,
      op,
      right,
    })
  },
})
