import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { TableNode } from './table-node.js'
import { ConstraintNode } from './constraint-node.js'
import { ColumnDefinitionNode } from './column-definition-node.js'
import { ArrayItemType } from '../util/type-utils.js'

export const ON_COMMIT_ACTIONS = ['preserve rows', 'delete rows', 'drop']
export type OnCommitAction = ArrayItemType<typeof ON_COMMIT_ACTIONS>

export type CreateTableNodeParams = Omit<
  CreateTableNode,
  | 'kind'
  | 'table'
  | 'columns'
  | 'constraints'
  | 'frontModifiers'
  | 'endModifiers'
>

export interface CreateTableNode extends OperationNode {
  readonly kind: 'CreateTableNode'
  readonly table: TableNode
  readonly columns: ReadonlyArray<ColumnDefinitionNode>
  readonly constraints?: ReadonlyArray<ConstraintNode>
  readonly temporary?: boolean
  readonly ifNotExists?: boolean
  readonly onCommit?: OnCommitAction
  readonly frontModifiers?: ReadonlyArray<OperationNode>
  readonly endModifiers?: ReadonlyArray<OperationNode>
  readonly selectQuery?: OperationNode
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

  cloneWithFrontModifier(
    createTable: CreateTableNode,
    modifier: OperationNode
  ): CreateTableNode {
    return freeze({
      ...createTable,
      frontModifiers: createTable.frontModifiers
        ? freeze([...createTable.frontModifiers, modifier])
        : freeze([modifier]),
    })
  },

  cloneWithEndModifier(
    createTable: CreateTableNode,
    modifier: OperationNode
  ): CreateTableNode {
    return freeze({
      ...createTable,
      endModifiers: createTable.endModifiers
        ? freeze([...createTable.endModifiers, modifier])
        : freeze([modifier]),
    })
  },

  cloneWith(
    createTable: CreateTableNode,
    params: CreateTableNodeParams
  ): CreateTableNode {
    return freeze({
      ...createTable,
      ...params,
    })
  },
})
