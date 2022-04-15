import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode } from './operation-node.js'
import { RawNode } from './raw-node.js'
import { ReferenceNode } from './reference-node.js'
import { SelectQueryNode } from './select-query-node.js'
import { TableNode } from './table-node.js'

export type AliasNodeChild =
  | ColumnNode
  | ReferenceNode
  | TableNode
  | SelectQueryNode
  | RawNode

export interface AliasNode extends OperationNode {
  readonly kind: 'AliasNode'
  readonly node: AliasNodeChild
  readonly alias: IdentifierNode | RawNode
}

/**
 * @internal
 */
export const AliasNode = freeze({
  is(node: OperationNode): node is AliasNode {
    return node.kind === 'AliasNode'
  },

  create(node: AliasNodeChild, alias: IdentifierNode | RawNode): AliasNode {
    return freeze({
      kind: 'AliasNode',
      node,
      alias,
    })
  },
})
