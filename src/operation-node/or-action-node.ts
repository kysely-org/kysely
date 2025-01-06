import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface OrActionNode extends OperationNode {
  readonly kind: 'OrActionNode'
  readonly action: string
}

/**
 * @internal
 */
export const OrActionNode = freeze({
  is(node: OperationNode): node is OrActionNode {
    return node.kind === 'OrActionNode'
  },

  create(action: string): OrActionNode {
    return freeze({
      kind: 'OrActionNode',
      action,
    })
  },
})
