import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'
import type { TableNode } from './table-node.js'
import type { ConstraintNode } from './constraint-node.js'
import type { ColumnDefinitionNode } from './column-definition-node.js'
import type { ArrayItemType } from '../util/type-utils.js'

export const ON_COMMIT_ACTIONS = ['preserve rows', 'delete rows', 'drop']
export type OnCommitAction = ArrayItemType<typeof ON_COMMIT_ACTIONS>

export type CreateTableNodeParams = Omit<
  CreateTableNode,
  | 'kind'
  | 'table'
  | 'columns'
  | 'constraints'
  | 'indexes'
  | 'frontModifiers'
  | 'endModifiers'
>

export interface CreateTableNode extends OperationNode {
  readonly kind: 'CreateTableNode'
  readonly table: TableNode
  readonly columns: ReadonlyArray<ColumnDefinitionNode>
  readonly constraints?: ReadonlyArray<ConstraintNode>
  readonly indexes?: ReadonlyArray<AddIndexNode>
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
    node: CreateTableNode,
    column: ColumnDefinitionNode,
  ): Readonly<CreateTableNode>
  cloneWithConstraint(
    node: CreateTableNode,
    constraint: ConstraintNode,
  ): Readonly<CreateTableNode>
  cloneWithIndex(
    node: CreateTableNode,
    index: AddIndexNode,
  ): Readonly<CreateTableNode>
  cloneWithFrontModifier(
    node: CreateTableNode,
    modifier: OperationNode,
  ): Readonly<CreateTableNode>
  cloneWithEndModifier(
    node: CreateTableNode,
    modifier: OperationNode,
  ): Readonly<CreateTableNode>
  cloneWith(
    node: CreateTableNode,
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

    cloneWithColumn(node, column) {
      return freeze({
        ...node,
        columns: freeze([...node.columns, column]),
      })
    },

    cloneWithConstraint(node, constraint) {
      return freeze({
        ...node,
        constraints: node.constraints
          ? freeze([...node.constraints, constraint])
          : freeze([constraint]),
      })
    },

    cloneWithIndex(node, index) {
      return freeze({
        ...node,
        indexes: node.indexes
          ? freeze([...node.indexes, index])
          : freeze([index]),
      })
    },

    cloneWithFrontModifier(node, modifier) {
      return freeze({
        ...node,
        frontModifiers: node.frontModifiers
          ? freeze([...node.frontModifiers, modifier])
          : freeze([modifier]),
      })
    },

    cloneWithEndModifier(node, modifier) {
      return freeze({
        ...node,
        endModifiers: node.endModifiers
          ? freeze([...node.endModifiers, modifier])
          : freeze([modifier]),
      })
    },

    cloneWith(node, params) {
      return freeze({
        ...node,
        ...params,
      })
    },
  })
