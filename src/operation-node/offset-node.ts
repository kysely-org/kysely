import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface OffsetNode extends OperationNode {
  readonly kind: 'OffsetNode'
  readonly offset: OperationNode
}

type OffsetNodeFactory = Readonly<{
  is(node: OperationNode): node is OffsetNode
  create(offset: OperationNode): Readonly<OffsetNode>
}>

/**
 * @internal
 */
export const OffsetNode: OffsetNodeFactory = freeze<OffsetNodeFactory>({
  is(node): node is OffsetNode {
    return node.kind === 'OffsetNode'
  },

  create(offset) {
    return freeze({
      kind: 'OffsetNode',
      offset,
    })
  },
})
