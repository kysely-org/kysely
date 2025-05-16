import { freeze } from '../util/object-utils.js'
import { AndNode } from './and-node.js'
import { OperationNode } from './operation-node.js'
import { OrNode } from './or-node.js'

export interface OnNode extends OperationNode {
  readonly kind: 'OnNode'
  readonly on: OperationNode
}

type OnNodeFactory = Readonly<{
  is(node: OperationNode): node is OnNode
  create(filter: OperationNode): Readonly<OnNode>
  cloneWithOperation(
    onNode: OnNode,
    operator: 'And' | 'Or',
    operation: OperationNode,
  ): Readonly<OnNode>
}>

/**
 * @internal
 */
export const OnNode: OnNodeFactory = freeze<OnNodeFactory>({
  is(node): node is OnNode {
    return node.kind === 'OnNode'
  },

  create(filter) {
    return freeze({
      kind: 'OnNode',
      on: filter,
    })
  },

  cloneWithOperation(onNode, operator, operation) {
    return freeze({
      ...onNode,
      on:
        operator === 'And'
          ? AndNode.create(onNode.on, operation)
          : OrNode.create(onNode.on, operation),
    })
  },
})
