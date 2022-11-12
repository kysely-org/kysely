import { freeze } from '../util/object-utils.js'
import { AndNode } from './and-node.js'
import { OperationNode } from './operation-node.js'
import { OrNode } from './or-node.js'

export interface WhereNode extends OperationNode {
  readonly kind: 'WhereNode'
  readonly where: OperationNode
}

/**
 * @internal
 */
export const WhereNode = freeze({
  is(node: OperationNode): node is WhereNode {
    return node.kind === 'WhereNode'
  },

  create(filter: OperationNode): WhereNode {
    return freeze({
      kind: 'WhereNode',
      where: filter,
    })
  },

  cloneWithOperation(
    whereNode: WhereNode,
    operator: 'And' | 'Or',
    operation: OperationNode
  ): WhereNode {
    return freeze({
      ...whereNode,
      where:
        operator === 'And'
          ? AndNode.create(whereNode.where, operation)
          : OrNode.create(whereNode.where, operation),
    })
  },
})
