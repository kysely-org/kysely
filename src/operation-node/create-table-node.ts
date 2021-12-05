import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { TableNode } from './table-node.js'
import { ConstraintNode } from './constraint-node.js'
import { ColumnDefinitionNode } from './column-definition-node.js'

export interface CreateTableNode extends OperationNode {
  readonly kind: 'CreateTableNode'
  readonly table: TableNode
  readonly columns: ReadonlyArray<ColumnDefinitionNode>
  readonly ifNotExists?: boolean
  readonly constraints?: ReadonlyArray<ConstraintNode>
}

/**
 * @internal
 */
export const CreateTableNode = freeze({
  is(node: OperationNode): node is CreateTableNode {
    return node.kind === 'CreateTableNode'
  },

  create(table: TableNode): CreateTableNode {
    return freeze({
      kind: 'CreateTableNode',
      table,
      columns: freeze([]),
    })
  },

  cloneWithColumn(
    createTable: CreateTableNode,
    column: ColumnDefinitionNode
  ): CreateTableNode {
    return freeze({
      ...createTable,
      columns: freeze([...createTable.columns, column]),
    })
  },

  cloneWithIfNotExists(
    createTable: CreateTableNode,
    ifNotExists: boolean
  ): CreateTableNode {
    return freeze({
      ...createTable,
      ifNotExists,
    })
  },

  cloneWithConstraint(
    createTable: CreateTableNode,
    constraint: ConstraintNode
  ): CreateTableNode {
    return freeze({
      ...createTable,
      constraints: createTable.constraints
        ? freeze([...createTable.constraints, constraint])
        : freeze([constraint]),
    })
  },
})
