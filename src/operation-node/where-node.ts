import { freeze } from '../util/object-utils.js'
import { AndNode } from './and-node.js'
import type { OperationNode } from './operation-node.js'
import { OrNode } from './or-node.js'

export interface WhereNode extends OperationNode {
  readonly kind: 'WhereNode'
  readonly where: OperationNode
}

type WhereNodeFactory = Readonly<{
  is(node: OperationNode): node is WhereNode
  create(filter: OperationNode): Readonly<WhereNode>
  cloneWithOperation(
    whereNode: WhereNode,
    operator: 'And' | 'Or',
    operation: OperationNode,
  ): Readonly<WhereNode>
}>

/**
 * @internal
 */
export const WhereNode: WhereNodeFactory = freeze<WhereNodeFactory>({
  is(node): node is WhereNode {
    return node.kind === 'WhereNode'
  },

  create(filter) {
    return freeze({
      kind: 'WhereNode',
      where: filter,
    })
  },

  cloneWithOperation(whereNode, operator, operation) {
    return freeze({
      ...whereNode,
      where:
        operator === 'And'
          ? AndNode.create(whereNode.where, operation)
          : OrNode.create(whereNode.where, operation),
    })
  },
})
