import { freeze } from '../util/object-utils.js'
import { AliasNode } from './alias-node.js'
import { ColumnNode } from './column-node.js'
import { OperationNode } from './operation-node.js'
import { referenceNode, ReferenceNode } from './reference-node.js'
import { selectAllNode, SelectAllNode } from './select-all-node.js'

type SelectionNodeChild = ColumnNode | ReferenceNode | AliasNode | SelectAllNode

export interface SelectionNode extends OperationNode {
  readonly kind: 'SelectionNode'
  readonly selection: SelectionNodeChild
}

/**
 * @internal
 */
export const selectionNode = freeze({
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
      selection: selectAllNode.create(),
    })
  },

  createSelectAllFromTable(table: string): SelectionNode {
    return freeze({
      kind: 'SelectionNode',
      selection: referenceNode.createSelectAll(table),
    })
  },
})
