import { ExplainFormat } from '../util/explainable.js'
import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface ExplainNode extends OperationNode {
  readonly kind: 'ExplainNode'
  readonly format?: ExplainFormat
  readonly options?: OperationNode
}

type ExplainNodeFactory = Readonly<{
  is(node: OperationNode): node is ExplainNode
  create(format?: ExplainFormat, options?: OperationNode): Readonly<ExplainNode>
}>

/**
 * @internal
 */
export const ExplainNode: ExplainNodeFactory = freeze<ExplainNodeFactory>({
  is(node): node is ExplainNode {
    return node.kind === 'ExplainNode'
  },

  create(format?, options?) {
    return freeze({
      kind: 'ExplainNode',
      format,
      options,
    })
  },
})
