import { freeze } from '../utils/object-utils'
import { AliasNode } from './alias-node'
import { OperationNode } from './operation-node'
import { TableNode } from './table-node'

type FromItemChildNode = TableNode | AliasNode

export interface FromItemNode extends OperationNode {
  readonly kind: 'FromItemNode'
  readonly from: FromItemChildNode
}

export function isFromItemNode(node: OperationNode): node is FromItemNode {
  return node.kind === 'FromItemNode'
}

export function createFromItemNode(from: FromItemChildNode): FromItemNode {
  return freeze({
    kind: 'FromItemNode',
    from,
  })
}
