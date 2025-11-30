import type { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'

export interface ParensNode extends OperationNode {
  readonly kind: 'ParensNode'
  readonly node: OperationNode
}

type ParensNodeFactory = Readonly<{
  is(node: OperationNode): node is ParensNode
  create(node: OperationNode): Readonly<ParensNode>
}>

/**
 * @internal
 */
export const ParensNode: ParensNodeFactory = freeze<ParensNodeFactory>({
  is(node): node is ParensNode {
    return node.kind === 'ParensNode'
  },

  create(node) {
    return freeze({
      kind: 'ParensNode',
      node,
    })
  },
})
