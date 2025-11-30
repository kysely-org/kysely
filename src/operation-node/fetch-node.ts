import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'
import { ValueNode } from './value-node.js'

export type FetchModifier = 'only' | 'with ties'

export interface FetchNode extends OperationNode {
  readonly kind: 'FetchNode'
  readonly rowCount: ValueNode
  readonly modifier: FetchModifier
}

type FetchNodeFactory = Readonly<{
  is(node: OperationNode): node is FetchNode
  create(
    rowCount: number | bigint,
    modifier: FetchModifier,
  ): Readonly<FetchNode>
}>

/**
 * @internal
 */
export const FetchNode: FetchNodeFactory = freeze<FetchNodeFactory>({
  is(node): node is FetchNode {
    return node.kind === 'FetchNode'
  },

  create(rowCount, modifier) {
    return {
      kind: 'FetchNode',
      rowCount: ValueNode.create(rowCount),
      modifier,
    }
  },
})
