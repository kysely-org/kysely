import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface MatchedNode extends OperationNode {
  readonly kind: 'MatchedNode'
  readonly not: boolean
  readonly bySource: boolean
}

/**
 * @internal
 */
export const MatchedNode = freeze({
  is(node: OperationNode): node is MatchedNode {
    return node.kind === 'MatchedNode'
  },

  create(not: boolean, bySource: boolean = false): MatchedNode {
    return freeze({
      kind: 'MatchedNode',
      not,
      bySource,
    })
  },
})
