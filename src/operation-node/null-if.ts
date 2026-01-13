import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface NullIfNode extends OperationNode {
  readonly kind: 'NullIfNode'
  readonly v1: OperationNode
  readonly v2: OperationNode
}

type NullIfNodeFactory = Readonly<{
  is(node: OperationNode): node is NullIfNode
  create(v1: OperationNode, v2: OperationNode): Readonly<NullIfNode>
}>

/**
 * @internal
 */
export const NullIfNode: NullIfNodeFactory = freeze<NullIfNodeFactory>({
  is(node): node is NullIfNode {
    return node.kind === 'NullIfNode'
  },

  create(v1, v2) {
    return freeze({
      kind: 'NullIfNode',
      v1,
      v2,
    })
  },
})
