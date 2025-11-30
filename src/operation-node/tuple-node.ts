import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'

export interface TupleNode extends OperationNode {
  readonly kind: 'TupleNode'
  readonly values: ReadonlyArray<OperationNode>
}

type TupleNodeFactory = Readonly<{
  is(node: OperationNode): node is TupleNode
  create(values: ReadonlyArray<OperationNode>): Readonly<TupleNode>
}>

/**
 * @internal
 */
export const TupleNode: TupleNodeFactory = freeze<TupleNodeFactory>({
  is(node): node is TupleNode {
    return node.kind === 'TupleNode'
  },

  create(values) {
    return freeze({
      kind: 'TupleNode',
      values: freeze(values),
    })
  },
})
