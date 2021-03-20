import { freeze } from '../utils/object-utils'
import { OperationNode } from './operation-node'
import { TableNode } from './table-node'

export type DropTableNodeModifier = 'IfExists'

export interface DropTableNode extends OperationNode {
  readonly kind: 'DropTableNode'
  readonly table: TableNode
  readonly modifier?: DropTableNodeModifier
}

export function isDropTableNode(node: OperationNode): node is DropTableNode {
  return node.kind === 'DropTableNode'
}

export function createDropTableNode(
  table: TableNode,
  modifier?: DropTableNodeModifier
): DropTableNode {
  return freeze({
    kind: 'DropTableNode',
    table,
    modifier,
  })
}
