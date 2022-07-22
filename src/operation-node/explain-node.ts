import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface ExplainNode extends OperationNode {
  readonly kind: 'ExplainNode'
  // TODO: format?
}

/**
 * @internal
 */
export const ExplainNode = freeze({
  is(node: OperationNode): node is ExplainNode {
    return node.kind === 'ExplainNode'
  },

  create(): ExplainNode {
    return freeze({
      kind: 'ExplainNode',
    })
  },
})
