import { OperationNode } from './operation-node.js'
import { ColumnNode } from './column-node.js'
import { TableNode } from './table-node.js'
import { SelectAllNode } from './select-all-node.js'
import { freeze } from '../util/object-utils.js'
import { JSONPathNode } from './json-path-node.js'

export interface ReferenceNode extends OperationNode {
  readonly kind: 'ReferenceNode'
  readonly column: ColumnNode | SelectAllNode
  readonly table?: TableNode
  readonly jsonPath?: JSONPathNode
}

/**
 * @internal
 */
export const ReferenceNode = freeze({
  is(node: OperationNode): node is ReferenceNode {
    return node.kind === 'ReferenceNode'
  },

  create(column: ColumnNode, table?: TableNode): ReferenceNode {
    return freeze({
      kind: 'ReferenceNode',
      table,
      column,
    })
  },

  createSelectAll(table: TableNode): ReferenceNode {
    return freeze({
      kind: 'ReferenceNode',
      table,
      column: SelectAllNode.create(),
    })
  },

  cloneWithJSONPath(
    reference: ReferenceNode,
    jsonPath: JSONPathNode
  ): ReferenceNode {
    return freeze({
      ...reference,
      jsonPath,
    })
  },
})
