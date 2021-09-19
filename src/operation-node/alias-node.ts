import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { IdentifierNode, identifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'
import { RawNode } from './raw-node.js'
import { ReferenceNode } from './reference-node.js'
import { SelectQueryNode } from './select-query-node.js'
import { TableNode } from './table-node.js'

export type AliasNodeChild =
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

/**
 * @internal
 */
export const aliasNode = freeze({
  is(node: OperationNode): node is AliasNode {
    return node.kind === 'AliasNode'
  },

  create(node: AliasNodeChild, alias: string): AliasNode {
    return freeze({
      kind: 'AliasNode',
      node,
      alias: identifierNode.create(alias),
    })
  },
})
