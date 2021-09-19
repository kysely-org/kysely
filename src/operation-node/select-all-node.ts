import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface SelectAllNode extends OperationNode {
  readonly kind: 'SelectAllNode'
}

/**
 * @internal
 */
export const selectAllNode = freeze({
  is(node: OperationNode): node is SelectAllNode {
    return node.kind === 'SelectAllNode'
  },

  create(): SelectAllNode {
    return freeze({
      kind: 'SelectAllNode',
    })
  },
})
