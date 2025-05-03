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

type SelectionNodeFactory = Readonly<{
  is(node: OperationNode): node is SelectionNode
  create(selection: SelectionNodeChild): Readonly<SelectionNode>
  createSelectAll(): Readonly<SelectionNode>
  createSelectAllFromTable(table: TableNode): Readonly<SelectionNode>
}>

/**
 * @internal
 */
export const SelectionNode: SelectionNodeFactory = freeze<SelectionNodeFactory>(
  {
    is(node): node is SelectionNode {
      return node.kind === 'SelectionNode'
    },

    create(selection) {
      return freeze({
        kind: 'SelectionNode',
        selection: selection,
      })
    },

    createSelectAll() {
      return freeze({
        kind: 'SelectionNode',
        selection: SelectAllNode.create(),
      })
    },

    createSelectAllFromTable(table) {
      return freeze({
        kind: 'SelectionNode',
        selection: ReferenceNode.createSelectAll(table),
      })
    },
  },
)
