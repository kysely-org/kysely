import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { RawNode } from './raw-node.js'

export type GeneratedAlwaysAsNodeParams = Omit<
  GeneratedAlwaysAsNode,
  'kind' | 'expression'
>

export interface GeneratedAlwaysAsNode extends OperationNode {
  readonly kind: 'GeneratedAlwaysAsNode'
  readonly expression: RawNode
  readonly stored?: boolean
}

/**
 * @internal
 */
export const GeneratedAlwaysAsNode = freeze({
  is(node: OperationNode): node is GeneratedAlwaysAsNode {
    return node.kind === 'GeneratedAlwaysAsNode'
  },

  create(expression: string): GeneratedAlwaysAsNode {
    return freeze({
      kind: 'GeneratedAlwaysAsNode',
      expression: RawNode.createWithSql(expression),
    })
  },

  cloneWith(
    node: GeneratedAlwaysAsNode,
    params: GeneratedAlwaysAsNodeParams
  ): GeneratedAlwaysAsNode {
    return freeze({
      ...node,
      ...params,
    })
  },
})
