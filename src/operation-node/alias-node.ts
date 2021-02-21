import { freeze } from '../utils/object-utils'
import { ColumnNode } from './column-node'
import { createIdentifierNode, IdentifierNode } from './identifier-node'
import { OperationNode } from './operation-node'
import { QueryNode } from './query-node'
import { RawNode } from './raw-node'
import { ReferenceNode } from './reference-node'
import { TableNode } from './table-node'

type AliasNodeChild =
  | ReferenceNode
  | TableNode
  | RawNode
  | QueryNode
  | ColumnNode

export interface AliasNode extends OperationNode {
  readonly kind: 'AliasNode'
  readonly node: AliasNodeChild
  readonly alias: IdentifierNode
}

export function isAliasNode(node: OperationNode): node is AliasNode {
  return node.kind === 'AliasNode'
}

export function createAliasNode(
  node: AliasNodeChild,
  alias: string
): AliasNode {
  return freeze({
    kind: 'AliasNode',
    node,
    alias: createIdentifierNode(alias),
  })
}
