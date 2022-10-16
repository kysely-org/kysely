import { freeze } from '../util/object-utils.js'
import { AndNode } from './and-node.js'
import { OperationNode } from './operation-node.js'
import { OrNode } from './or-node.js'

export interface OnNode extends OperationNode {
  readonly kind: 'OnNode'
  readonly on: OperationNode
}

/**
 * @internal
 */
export const OnNode = freeze({
  is(node: OperationNode): node is OnNode {
    return node.kind === 'OnNode'
  },

  create(filter: OperationNode): OnNode {
    return freeze({
      kind: 'OnNode',
      on: filter,
    })
  },

  cloneWithFilter(
    onNode: OnNode,
    op: 'And' | 'Or',
    filter: OperationNode
  ): OnNode {
    return freeze({
      ...onNode,
      on:
        op === 'And'
          ? AndNode.create(onNode.on, filter)
          : OrNode.create(onNode.on, filter),
    })
  },
})
