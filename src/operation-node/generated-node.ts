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

type GeneratedNodeFactory = Readonly<{
  is(node: OperationNode): node is GeneratedNode
  create(params: GeneratedNodeParams): Readonly<GeneratedNode>
  createWithExpression(expression: OperationNode): Readonly<GeneratedNode>
  cloneWith(
    node: GeneratedNode,
    params: GeneratedNodeParams,
  ): Readonly<GeneratedNode>
}>

/**
 * @internal
 */
export const GeneratedNode: GeneratedNodeFactory = freeze<GeneratedNodeFactory>(
  {
    is(node): node is GeneratedNode {
      return node.kind === 'GeneratedNode'
    },

    create(params) {
      return freeze({
        kind: 'GeneratedNode',
        ...params,
      })
    },

    createWithExpression(expression) {
      return freeze({
        kind: 'GeneratedNode',
        always: true,
        expression,
      })
    },

    cloneWith(node, params) {
      return freeze({
        ...node,
        ...params,
      })
    },
  },
)
