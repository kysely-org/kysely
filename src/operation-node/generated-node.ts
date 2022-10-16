import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export type GeneratedNodeParams = Omit<GeneratedNode, 'kind' | 'expression'>

export interface GeneratedNode extends OperationNode {
  readonly kind: 'GeneratedNode'
  readonly byDefault?: boolean
  readonly always?: boolean
  readonly identity?: boolean
  readonly stored?: boolean
  readonly expression?: OperationNode
}

/**
 * @internal
 */
export const GeneratedNode = freeze({
  is(node: OperationNode): node is GeneratedNode {
    return node.kind === 'GeneratedNode'
  },

  create(params: GeneratedNodeParams): GeneratedNode {
    return freeze({
      kind: 'GeneratedNode',
      ...params,
    })
  },

  createWithExpression(expression: OperationNode): GeneratedNode {
    return freeze({
      kind: 'GeneratedNode',
      always: true,
      expression,
    })
  },

  cloneWith(node: GeneratedNode, params: GeneratedNodeParams): GeneratedNode {
    return freeze({
      ...node,
      ...params,
    })
  },
})
