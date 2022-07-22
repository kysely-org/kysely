import { freeze } from '../util/object-utils.js'
import { AnyRawBuilder } from '../util/type-utils.js'
import { OperationNode } from './operation-node.js'
import { RawNode } from './raw-node.js'

export type ExplainFormat =
  | 'text'
  | 'xml'
  | 'json'
  | 'yaml'
  | 'traditional'
  | 'tree'

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

  create(formatOrOptions?: ExplainFormat | AnyRawBuilder): ExplainNode {
    return freeze({
      kind: 'ExplainNode',
      format: typeof formatOrOptions === 'string' ? formatOrOptions : undefined,
      options:
        typeof formatOrOptions === 'object'
          ? formatOrOptions.toOperationNode()
          : undefined,
    })
  },
})
