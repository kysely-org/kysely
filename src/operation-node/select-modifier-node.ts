import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'

export type SelectModifier =
  | 'ForUpdate'
  | 'ForNoKeyUpdate'
  | 'ForShare'
  | 'ForKeyShare'
  | 'NoWait'
  | 'SkipLocked'
  | 'Distinct'

export interface SelectModifierNode extends OperationNode {
  readonly kind: 'SelectModifierNode'
  readonly modifier?: SelectModifier
  readonly rawModifier?: OperationNode
}

/**
 * @internal
 */
export const SelectModifierNode = freeze({
  is(node: OperationNode): node is SelectModifierNode {
    return node.kind === 'SelectModifierNode'
  },

  create(modifier: SelectModifier): SelectModifierNode {
    return freeze({
      kind: 'SelectModifierNode',
      modifier,
    })
  },

  createWithExpression(modifier: OperationNode): SelectModifierNode {
    return freeze({
      kind: 'SelectModifierNode',
      rawModifier: modifier,
    })
  },
})
