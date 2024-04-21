import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export type TopModifier = 'percent' | 'with ties' | 'percent with ties'

export interface TopNode extends OperationNode {
  readonly kind: 'TopNode'
  readonly expression: number | bigint
  readonly modifiers?: TopModifier
}

/**
 * @internal
 */
export const TopNode = freeze({
  is(node: OperationNode): node is TopNode {
    return node.kind === 'TopNode'
  },

  create(expression: number | bigint, modifiers?: TopModifier): TopNode {
    return freeze({
      kind: 'TopNode',
      expression,
      modifiers,
    })
  },
})
