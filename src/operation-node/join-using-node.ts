import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { ColumnNode } from './column-node.js'

export interface JoinUsingNode extends OperationNode {
  readonly kind: 'JoinUsingNode'
  readonly columns: ReadonlyArray<ColumnNode>
}

/**
 * @internal
 */
export const JoinUsingNode = freeze({
  is(node: OperationNode): node is JoinUsingNode {
    return node.kind === 'JoinUsingNode'
  },

  create(columns: string[]): JoinUsingNode {
    return freeze({
      kind: 'JoinUsingNode',
      columns: freeze(columns.map(ColumnNode.create)),
    })
  },
})
