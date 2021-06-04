import { freeze } from '../util/object-utils'
import { ColumnNode } from './column-node'
import { createIdentifierNode, IdentifierNode } from './identifier-node'
import { OperationNode } from './operation-node'
import { RawNode } from './raw-node'
import { ReferenceNode } from './reference-node'
import { SelectQueryNode } from './select-query-node'
import { TableNode } from './table-node'

type AliasNodeChild =
  | ColumnNode
  | ReferenceNode
  | TableNode
  | RawNode
  | SelectQueryNode

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
