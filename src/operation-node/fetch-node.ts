import { OperationNode } from './operation-node.js'
import { ValueNode } from './value-node.js'

export type FetchModifier = 'only' | 'with ties'

export interface FetchNode extends OperationNode {
  readonly kind: 'FetchNode'
  readonly rowCount: ValueNode
  readonly modifier: FetchModifier
}

/**
 * @internal
 */
export const FetchNode = {
  is(node: OperationNode): node is FetchNode {
    return node.kind === 'FetchNode'
  },

  create(rowCount: number | bigint, modifier: FetchModifier): FetchNode {
    return {
      kind: 'FetchNode',
      rowCount: ValueNode.create(rowCount),
      modifier,
    }
  },
}
