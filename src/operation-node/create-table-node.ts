import { freeze } from '../util/object-utils'
import {
  checkConstraintNode,
  CheckConstraintNode,
} from './check-constraint-node'
import { AddColumnNode } from './add-column-node'
import { OperationNode } from './operation-node'
import { TableNode } from './table-node'
import {
  tablePrimaryConstraintNode,
  TablePrimaryConstraintNode,
} from './table-primary-constraint-node'
import {
  tableUniqueConstraintNode,
  TableUniqueConstraintNode,
} from './table-unique-constraint-node'

export type CreateTableNodeModifier = 'IfNotExists'

export interface CreateTableNode extends OperationNode {
  readonly kind: 'CreateTableNode'
  readonly table: TableNode
  readonly columns: ReadonlyArray<AddColumnNode>
  readonly modifier?: CreateTableNodeModifier
  readonly primaryKeyConstraint?: TablePrimaryConstraintNode
  readonly uniqueConstraints?: ReadonlyArray<TableUniqueConstraintNode>
  readonly checkConstraints?: ReadonlyArray<CheckConstraintNode>
}

export const createTableNode = freeze({
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
    column: AddColumnNode
  ): CreateTableNode {
    return freeze({
      ...createTable,
      columns: freeze([...createTable.columns, column]),
    })
  },

  cloneWithModifier(
    createTable: CreateTableNode,
    modifier: CreateTableNodeModifier
  ): CreateTableNode {
    return freeze({
      ...createTable,
      modifier,
    })
  },

  cloneWithPrimaryKeyConstraint(
    createTable: CreateTableNode,
    columns: string[]
  ): CreateTableNode {
    return freeze({
      ...createTable,
      primaryKeyConstraint: tablePrimaryConstraintNode.create(columns),
    })
  },

  cloneWithUniqueConstraint(
    createTable: CreateTableNode,
    columns: string[]
  ): CreateTableNode {
    const constraint = tableUniqueConstraintNode.create(columns)

    return freeze({
      ...createTable,
      uniqueConstraints: createTable.uniqueConstraints
        ? freeze([...createTable.uniqueConstraints, constraint])
        : freeze([constraint]),
    })
  },

  cloneWithCheckConstraint(
    createTable: CreateTableNode,
    sql: string
  ): CreateTableNode {
    const constraint = checkConstraintNode.create(sql)

    return freeze({
      ...createTable,
      checkConstraints: createTable.checkConstraints
        ? freeze([...createTable.checkConstraints, constraint])
        : freeze([constraint]),
    })
  },
})
