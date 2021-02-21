import { freeze } from '../utils/object-utils'
import { AliasNode } from './alias-node'
import { OperationNode } from './operation-node'
import { TableNode } from './table-node'

type FromNodeChild = TableNode | AliasNode

export interface FromNode extends OperationNode {
  readonly kind: 'FromNode'
  readonly from: FromNodeChild
}

export function isFromNode(node: OperationNode): node is FromNode {
  return node.kind === 'FromNode'
}

export function createFromNode(from: FromNodeChild): FromNode {
  return freeze({
    kind: 'FromNode',
    from,
  })
}
