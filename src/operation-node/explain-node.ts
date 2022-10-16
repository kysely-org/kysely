import { ExplainFormat } from '../util/explainable.js'
import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface ExplainNode extends OperationNode {
  readonly kind: 'ExplainNode'
  readonly format?: ExplainFormat
  readonly options?: OperationNode
}

/**
 * @internal
 */
export const ExplainNode = freeze({
  is(node: OperationNode): node is ExplainNode {
    return node.kind === 'ExplainNode'
  },

  create(format?: ExplainFormat, options?: OperationNode): ExplainNode {
    return freeze({
      kind: 'ExplainNode',
      format,
      options,
    })
  },
})
