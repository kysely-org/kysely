import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'

export interface InsertModifierNode extends OperationNode {
  readonly kind: 'InsertModifierNode'
  readonly rawModifier?: OperationNode
  readonly of?: ReadonlyArray<OperationNode>
}

/**
 * @internal
 */
export const InsertModifierNode = freeze({
  is(node: OperationNode): node is InsertModifierNode {
    return node.kind === 'InsertModifierNode'
  },

  createWithExpression(modifier: OperationNode): InsertModifierNode {
    return freeze({
      kind: 'InsertModifierNode',
      rawModifier: modifier,
    })
  },
})
