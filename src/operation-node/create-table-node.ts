import { freeze } from '../util/object-utils.js'
import { checkConstraintNode } from './check-constraint-node.js'
import { OperationNode } from './operation-node.js'
import { tableNode, TableNode } from './table-node.js'
import { primaryConstraintNode } from './primary-constraint-node.js'
import { uniqueConstraintNode } from './unique-constraint-node.js'
import { foreignKeyConstraintNode } from './foreign-key-constraint-node.js'
import { columnNode } from './column-node.js'
import { ConstraintNode } from './constraint-node.js'
import { ColumnDefinitionNode } from './column-definition-node.js'

export type CreateTableNodeModifier = 'IfNotExists'

export interface CreateTableNode extends OperationNode {
  readonly kind: 'CreateTableNode'
  readonly table: TableNode
  readonly columns: ReadonlyArray<ColumnDefinitionNode>
  readonly modifier?: CreateTableNodeModifier
  readonly constraints?: ReadonlyArray<ConstraintNode>
}

/**
 * @internal
 */
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
    column: ColumnDefinitionNode
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
    const constraint = primaryConstraintNode.create(columns, constraintName)

    return freeze({
      ...createTable,
      constraints: createTable.constraints
        ? freeze([...createTable.constraints, constraint])
        : freeze([constraint]),
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
      constraints: createTable.constraints
        ? freeze([...createTable.constraints, constraint])
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
      constraints: createTable.constraints
        ? freeze([...createTable.constraints, constraint])
        : freeze([constraint]),
    })
  },

  cloneWithForeignKeyConstraint(
    createTable: CreateTableNode,
    constraintName: string,
    sourceColumns: string[],
    targetTable: string,
    targetColumns: string[]
  ): CreateTableNode {
    const constraint = foreignKeyConstraintNode.create(
      sourceColumns.map(columnNode.create),
      tableNode.create(targetTable),
      targetColumns.map(columnNode.create),
      constraintName
    )

    return freeze({
      ...createTable,
      constraints: createTable.constraints
        ? freeze([...createTable.constraints, constraint])
        : freeze([constraint]),
    })
  },
})
