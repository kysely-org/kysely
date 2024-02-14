import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'

export interface UpdateModifierNode extends OperationNode {
  readonly kind: 'UpdateModifierNode'
  readonly rawModifier?: OperationNode
  readonly of?: ReadonlyArray<OperationNode>
}

/**
 * @internal
 */
export const UpdateModifierNode = freeze({
  is(node: OperationNode): node is UpdateModifierNode {
    return node.kind === 'UpdateModifierNode'
  },

  createWithExpression(modifier: OperationNode): UpdateModifierNode {
    return freeze({
      kind: 'UpdateModifierNode',
      rawModifier: modifier,
    })
  },
})
