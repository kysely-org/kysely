import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { TableNode } from './table-node.js'
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
