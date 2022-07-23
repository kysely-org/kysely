import { ExplainFormat } from '../util/explainable.js'
import { freeze } from '../util/object-utils.js'
import { AnyRawBuilder } from '../util/type-utils.js'
import { OperationNode } from './operation-node.js'
import { RawNode } from './raw-node.js'

export interface ExplainNode extends OperationNode {
  readonly kind: 'ExplainNode'
  readonly format?: ExplainFormat
  readonly options?: RawNode
}

/**
 * @internal
 */
export const ExplainNode = freeze({
  is(node: OperationNode): node is ExplainNode {
    return node.kind === 'ExplainNode'
  },

  create(format?: ExplainFormat, options?: AnyRawBuilder): ExplainNode {
    return freeze({
      kind: 'ExplainNode',
      format,
      options: options?.toOperationNode(),
    })
  },
})
