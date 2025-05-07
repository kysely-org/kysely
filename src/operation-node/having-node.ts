import { freeze } from '../util/object-utils.js'
import { AndNode } from './and-node.js'
import { OperationNode } from './operation-node.js'
import { OrNode } from './or-node.js'

export interface HavingNode extends OperationNode {
  readonly kind: 'HavingNode'
  readonly having: OperationNode
}

type HavingNodeFactory = Readonly<{
  is(node: OperationNode): node is HavingNode
  create(filter: OperationNode): Readonly<HavingNode>
  cloneWithOperation(
    havingNode: HavingNode,
    operator: 'And' | 'Or',
    operation: OperationNode,
  ): Readonly<HavingNode>
}>

/**
 * @internal
 */
export const HavingNode: HavingNodeFactory = freeze<HavingNodeFactory>({
  is(node): node is HavingNode {
    return node.kind === 'HavingNode'
  },

  create(filter) {
    return freeze({
      kind: 'HavingNode',
      having: filter,
    })
  },

  cloneWithOperation(havingNode, operator, operation) {
    return freeze({
      ...havingNode,
      having:
        operator === 'And'
          ? AndNode.create(havingNode.having, operation)
          : OrNode.create(havingNode.having, operation),
    })
  },
})
