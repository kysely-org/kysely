import { freeze } from '../util/object-utils'
import { OperationNode } from './operation-node'
import { TableExpressionNode } from './operation-node-utils'

export interface FromNode extends OperationNode {
  readonly kind: 'FromNode'
  readonly froms: ReadonlyArray<TableExpressionNode>
}

export const fromNode = freeze({
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
