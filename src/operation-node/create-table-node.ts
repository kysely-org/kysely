import { freeze } from '../util/object-utils'
import {
  checkConstraintNode,
  CheckConstraintNode,
} from './check-constraint-node'
import { AddColumnNode } from './add-column-node'
import { OperationNode } from './operation-node'
import { TableNode } from './table-node'
import {
  primaryConstraintNode,
  PrimaryKeyConstraintNode,
} from './primary-constraint-node'
import {
  UniqueConstraintNode,
  uniqueConstraintNode,
} from './unique-constraint-node'

export type CreateTableNodeModifier = 'IfNotExists'

export interface CreateTableNode extends OperationNode {
  readonly kind: 'CreateTableNode'
  readonly table: TableNode
  readonly columns: ReadonlyArray<AddColumnNode>
  readonly modifier?: CreateTableNodeModifier
  readonly primaryKeyConstraint?: PrimaryKeyConstraintNode
  readonly uniqueConstraints?: ReadonlyArray<UniqueConstraintNode>
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
    constraintName: string,
    columns: string[]
  ): CreateTableNode {
    return freeze({
      ...createTable,
      primaryKeyConstraint: primaryConstraintNode.create(
        columns,
        constraintName
      ),
    })
  },

  cloneWithUniqueConstraint(
    createTable: CreateTableNode,
    constraintName: string,
    columns: string[]
  ): CreateTableNode {
    const constraint = uniqueConstraintNode.create(columns, constraintName)

    return freeze({
      ...createTable,
      uniqueConstraints: createTable.uniqueConstraints
        ? freeze([...createTable.uniqueConstraints, constraint])
        : freeze([constraint]),
    })
  },

  cloneWithCheckConstraint(
    createTable: CreateTableNode,
    constraintName: string,
    sql: string
  ): CreateTableNode {
    const constraint = checkConstraintNode.create(sql, constraintName)

    return freeze({
      ...createTable,
      checkConstraints: createTable.checkConstraints
        ? freeze([...createTable.checkConstraints, constraint])
        : freeze([constraint]),
    })
  },
})
