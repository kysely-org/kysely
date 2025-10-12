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

type CreateTableNodeFactory = Readonly<{
  is(node: OperationNode): node is CreateTableNode
  create(table: TableNode): Readonly<CreateTableNode>
  cloneWithColumn(
    createTable: CreateTableNode,
    column: ColumnDefinitionNode,
  ): Readonly<CreateTableNode>
  cloneWithConstraint(
    createTable: CreateTableNode,
    constraint: ConstraintNode,
  ): Readonly<CreateTableNode>
  cloneWithFrontModifier(
    createTable: CreateTableNode,
    modifier: OperationNode,
  ): Readonly<CreateTableNode>
  cloneWithEndModifier(
    createTable: CreateTableNode,
    modifier: OperationNode,
  ): Readonly<CreateTableNode>
  cloneWith(
    createTable: CreateTableNode,
    params: CreateTableNodeParams,
  ): Readonly<CreateTableNode>
}>

/**
 * @internal
 */
export const CreateTableNode: CreateTableNodeFactory =
  freeze<CreateTableNodeFactory>({
    is(node): node is CreateTableNode {
      return node.kind === 'CreateTableNode'
    },

    create(table) {
      return freeze({
        kind: 'CreateTableNode',
        table,
        columns: freeze([]),
      })
    },

    cloneWithColumn(createTable, column) {
      return freeze({
        ...createTable,
        columns: freeze([...createTable.columns, column]),
      })
    },

    cloneWithConstraint(createTable, constraint) {
      return freeze({
        ...createTable,
        constraints: createTable.constraints
          ? freeze([...createTable.constraints, constraint])
          : freeze([constraint]),
      })
    },

    cloneWithFrontModifier(createTable, modifier) {
      return freeze({
        ...createTable,
        frontModifiers: createTable.frontModifiers
          ? freeze([...createTable.frontModifiers, modifier])
          : freeze([modifier]),
      })
    },

    cloneWithEndModifier(createTable, modifier) {
      return freeze({
        ...createTable,
        endModifiers: createTable.endModifiers
          ? freeze([...createTable.endModifiers, modifier])
          : freeze([modifier]),
      })
    },

    cloneWith(createTable, params) {
      return freeze({
        ...createTable,
        ...params,
      })
    },
  })
