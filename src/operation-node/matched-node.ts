import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'

export interface MatchedNode extends OperationNode {
  readonly kind: 'MatchedNode'
  readonly not: boolean
  readonly bySource: boolean
}

type MatchedNodeFactory = Readonly<{
  is(node: OperationNode): node is MatchedNode
  create(not: boolean, bySource?: boolean): Readonly<MatchedNode>
}>

/**
 * @internal
 */
export const MatchedNode: MatchedNodeFactory = freeze<MatchedNodeFactory>({
  is(node): node is MatchedNode {
    return node.kind === 'MatchedNode'
  },

  create(not, bySource = false) {
    return freeze({
      kind: 'MatchedNode',
      not,
      bySource,
    })
  },
})
