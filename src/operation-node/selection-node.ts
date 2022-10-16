import { freeze } from '../util/object-utils.js'
import { AliasNode } from './alias-node.js'
import { OperationNode } from './operation-node.js'
import { ReferenceNode } from './reference-node.js'
import { SelectAllNode } from './select-all-node.js'
import { SimpleReferenceExpressionNode } from './simple-reference-expression-node.js'
import { TableNode } from './table-node.js'

type SelectionNodeChild =
  | SimpleReferenceExpressionNode
  | AliasNode
  | SelectAllNode

export interface SelectionNode extends OperationNode {
  readonly kind: 'SelectionNode'
  readonly selection: SelectionNodeChild
}

/**
 * @internal
 */
export const SelectionNode = freeze({
  is(node: OperationNode): node is SelectionNode {
    return node.kind === 'SelectionNode'
  },

  create(selection: SelectionNodeChild): SelectionNode {
    return freeze({
      kind: 'SelectionNode',
      selection: selection,
    })
  },

  createSelectAll(): SelectionNode {
    return freeze({
      kind: 'SelectionNode',
      selection: SelectAllNode.create(),
    })
  },

  createSelectAllFromTable(table: TableNode): SelectionNode {
    return freeze({
      kind: 'SelectionNode',
      selection: ReferenceNode.createSelectAll(table),
    })
  },
})
