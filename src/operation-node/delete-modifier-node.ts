import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'

export interface DeleteModifierNode extends OperationNode {
  readonly kind: 'DeleteModifierNode'
  readonly rawModifier?: OperationNode
  readonly of?: ReadonlyArray<OperationNode>
}

/**
 * @internal
 */
export const DeleteModifierNode = freeze({
  is(node: OperationNode): node is DeleteModifierNode {
    return node.kind === 'DeleteModifierNode'
  },

  createWithExpression(modifier: OperationNode): DeleteModifierNode {
    return freeze({
      kind: 'DeleteModifierNode',
      rawModifier: modifier,
    })
  },
})
