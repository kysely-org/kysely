import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface TopNode extends OperationNode {
  readonly kind: 'TopNode'
  readonly expression: number
  readonly percent: boolean
  readonly withTies: boolean
}

/**
 * @internal
 */
export const TopNode = freeze({
  is(node: OperationNode): node is TopNode {
    return node.kind === 'TopNode'
  },

  create(expression: number, percent: boolean, withTies: boolean): TopNode {
    return freeze({
      kind: 'TopNode',
      expression,
      percent,
      withTies,
    })
  },
})
