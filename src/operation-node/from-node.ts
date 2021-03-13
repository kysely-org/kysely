import { freeze } from '../utils/object-utils'
import { FromItemNode } from './from-item-node'
import { OperationNode } from './operation-node'

export interface FromNode extends OperationNode {
  readonly kind: 'FromNode'
  readonly froms: ReadonlyArray<FromItemNode>
}

export function isFromNode(node: OperationNode): node is FromNode {
  return node.kind === 'FromNode'
}

export function createFromNodeWithItems(froms: ReadonlyArray<FromItemNode>): FromNode {
  return freeze({
    kind: 'FromNode',
    froms: freeze(froms),
  })
}

export function cloneFromNodeWithItems(
  from: FromNode,
  items: ReadonlyArray<FromItemNode>
): FromNode {
  return freeze({
    ...from,
    froms: freeze([...from.froms, ...items]),
  })
}
