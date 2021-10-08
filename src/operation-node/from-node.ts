import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { TableExpressionNode } from './operation-node-utils.js'

export interface FromNode extends OperationNode {
  readonly kind: 'FromNode'
  readonly froms: ReadonlyArray<TableExpressionNode>
}

/**
 * @internal
 */
export const FromNode = freeze({
  is(node: OperationNode): node is FromNode {
    return node.kind === 'FromNode'
  },

  create(froms: ReadonlyArray<TableExpressionNode>): FromNode {
    return freeze({
      kind: 'FromNode',
      froms: freeze(froms),
    })
  },

  cloneWithFroms(
    from: FromNode,
    froms: ReadonlyArray<TableExpressionNode>
  ): FromNode {
    return freeze({
      ...from,
      froms: freeze([...from.froms, ...froms]),
    })
  },
})
