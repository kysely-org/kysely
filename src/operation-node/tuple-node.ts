import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface TupleNode extends OperationNode {
  readonly kind: 'TupleNode'
  readonly values: ReadonlyArray<OperationNode>
}

/**
 * @internal
 */
export const TupleNode = freeze({
  is(node: OperationNode): node is TupleNode {
    return node.kind === 'TupleNode'
  },

  create(values: ReadonlyArray<OperationNode>): TupleNode {
    return freeze({
      kind: 'TupleNode',
      values: freeze(values),
    })
  },
})
