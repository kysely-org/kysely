import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface OrNode extends OperationNode {
  readonly kind: 'OrNode'
  readonly left: OperationNode
  readonly right: OperationNode
}

type OrNodeFactory = Readonly<{
  is(node: OperationNode): node is OrNode
  create(left: OperationNode, right: OperationNode): Readonly<OrNode>
}>

/**
 * @internal
 */
export const OrNode: OrNodeFactory = freeze<OrNodeFactory>({
  is(node): node is OrNode {
    return node.kind === 'OrNode'
  },

  create(left, right) {
    return freeze({
      kind: 'OrNode',
      left,
      right,
    })
  },
})
