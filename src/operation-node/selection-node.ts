import { freeze } from '../utils/object-utils'
import { AliasNode } from './alias-node'
import { ColumnNode, createColumnNode } from './column-node'
import { OperationNode } from './operation-node'
import { createSelectAllReferenceNode, ReferenceNode } from './reference-node'
import { createSelectAllNode, SelectAllNode } from './select-all-node'

type SelectionNodeChild = ColumnNode | ReferenceNode | AliasNode | SelectAllNode

export interface SelectionNode extends OperationNode {
  readonly kind: 'SelectionNode'
  readonly selection: SelectionNodeChild
}

export function isSelectionNode(node: OperationNode): node is SelectionNode {
  return node.kind === 'SelectionNode'
}

export function createSelectionNode(
  selection: SelectionNodeChild
): SelectionNode {
  return freeze({
    kind: 'SelectionNode',
    selection: selection,
  })
}

export function createSelectAllSelectionNode(): SelectionNode {
  return freeze({
    kind: 'SelectionNode',
    selection: createSelectAllNode(),
  })
}

export function createSelectAllSelectionNodeWithTable(
  table: string
): SelectionNode {
  return freeze({
    kind: 'SelectionNode',
    selection: createSelectAllReferenceNode(table),
  })
}
