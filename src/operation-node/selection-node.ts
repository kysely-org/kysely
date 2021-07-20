import { freeze } from '../util/object-utils'
import { AliasNode } from './alias-node'
import { ColumnNode } from './column-node'
import { OperationNode } from './operation-node'
import { referenceNode, ReferenceNode } from './reference-node'
import { selectAllNode, SelectAllNode } from './select-all-node'

type SelectionNodeChild = ColumnNode | ReferenceNode | AliasNode | SelectAllNode

export interface SelectionNode extends OperationNode {
  readonly kind: 'SelectionNode'
  readonly selection: SelectionNodeChild
}

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
