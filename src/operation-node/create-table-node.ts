import { freeze } from '../util/object-utils.js'
import { CheckConstraintNode } from './check-constraint-node.js'
import { OperationNode } from './operation-node.js'
import { TableNode } from './table-node.js'
import { PrimaryConstraintNode } from './primary-constraint-node.js'
import { UniqueConstraintNode } from './unique-constraint-node.js'
import { ForeignKeyConstraintNode } from './foreign-key-constraint-node.js'
import { ColumnNode } from './column-node.js'
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
    const constraint = PrimaryConstraintNode.create(columns, constraintName)

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
    const constraint = UniqueConstraintNode.create(columns, constraintName)

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
    const constraint = CheckConstraintNode.create(sql, constraintName)

    return freeze({
      ...createTable,
      constraints: createTable.constraints
        ? freeze([...createTable.constraints, constraint])
        : freeze([constraint]),
    })
  },

  cloneWithForeignKeyConstraint(
    createTable: CreateTableNode,
    constraint: ForeignKeyConstraintNode
  ): CreateTableNode {
    return freeze({
      ...createTable,
      constraints: createTable.constraints
        ? freeze([...createTable.constraints, constraint])
        : freeze([constraint]),
    })
  },
})
