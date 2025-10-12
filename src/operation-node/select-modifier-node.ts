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
  readonly of?: ReadonlyArray<OperationNode>
}

type SelectModifierNodeFactory = Readonly<{
  is(node: OperationNode): node is SelectModifierNode
  create(
    modifier: SelectModifier,
    of?: ReadonlyArray<OperationNode>,
  ): Readonly<SelectModifierNode>
  createWithExpression(modifier: OperationNode): Readonly<SelectModifierNode>
}>

/**
 * @internal
 */
export const SelectModifierNode: SelectModifierNodeFactory =
  freeze<SelectModifierNodeFactory>({
    is(node): node is SelectModifierNode {
      return node.kind === 'SelectModifierNode'
    },

    create(modifier, of?) {
      return freeze({
        kind: 'SelectModifierNode',
        modifier,
        of,
      })
    },

    createWithExpression(modifier) {
      return freeze({
        kind: 'SelectModifierNode',
        rawModifier: modifier,
      })
    },
  })
