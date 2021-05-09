import { freeze } from '../utils/object-utils'
import { OperationNode } from './operation-node'
import { TableExpressionNode } from './operation-node-utils'

export interface FromNode extends OperationNode {
  readonly kind: 'FromNode'
  readonly froms: ReadonlyArray<TableExpressionNode>
}

export function isFromNode(node: OperationNode): node is FromNode {
  return node.kind === 'FromNode'
}

export function createFromNodeWithItems(
  froms: ReadonlyArray<TableExpressionNode>
): FromNode {
  return freeze({
    kind: 'FromNode',
    froms: freeze(froms),
  })
}

export function cloneFromNodeWithItems(
  from: FromNode,
  items: ReadonlyArray<TableExpressionNode>
): FromNode {
  return freeze({
    ...from,
    froms: freeze([...from.froms, ...items]),
  })
}
