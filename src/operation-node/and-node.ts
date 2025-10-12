import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'

export interface AndNode extends OperationNode {
  readonly kind: 'AndNode'
  readonly left: OperationNode
  readonly right: OperationNode
}

type AndNodeFactory = Readonly<{
  is(node: OperationNode): node is AndNode
  create(left: OperationNode, right: OperationNode): Readonly<AndNode>
}>

/**
 * @internal
 */
export const AndNode: AndNodeFactory = freeze<AndNodeFactory>({
  is(node): node is AndNode {
    return node.kind === 'AndNode'
  },

  create(left, right) {
    return freeze({
      kind: 'AndNode',
      left,
      right,
    })
  },
})
