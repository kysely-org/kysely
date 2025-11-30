import type { OperationNode } from './operation-node.js'
import type { ColumnNode } from './column-node.js'
import type { TableNode } from './table-node.js'
import { freeze } from '../util/object-utils.js'
import type { ArrayItemType } from '../util/type-utils.js'

export const ON_MODIFY_FOREIGN_ACTIONS = [
  'no action',
  'restrict',
  'cascade',
  'set null',
  'set default',
] as const

export type OnModifyForeignAction = ArrayItemType<
  typeof ON_MODIFY_FOREIGN_ACTIONS
>

export interface ReferencesNode extends OperationNode {
  readonly kind: 'ReferencesNode'
  readonly table: TableNode
  readonly columns: ReadonlyArray<ColumnNode>
  readonly onDelete?: OnModifyForeignAction
  readonly onUpdate?: OnModifyForeignAction
}

type ReferencesNodeFactory = Readonly<{
  is(node: OperationNode): node is ReferencesNode
  create(
    table: TableNode,
    columns: ReadonlyArray<ColumnNode>,
  ): Readonly<ReferencesNode>
  cloneWithOnDelete(
    references: ReferencesNode,
    onDelete: OnModifyForeignAction,
  ): Readonly<ReferencesNode>
  cloneWithOnUpdate(
    references: ReferencesNode,
    onUpdate: OnModifyForeignAction,
  ): Readonly<ReferencesNode>
}>

/**
 * @internal
 */
export const ReferencesNode: ReferencesNodeFactory =
  freeze<ReferencesNodeFactory>({
    is(node): node is ReferencesNode {
      return node.kind === 'ReferencesNode'
    },

    create(table, columns) {
      return freeze({
        kind: 'ReferencesNode',
        table,
        columns: freeze([...columns]),
      })
    },

    cloneWithOnDelete(references, onDelete) {
      return freeze({
        ...references,
        onDelete,
      })
    },

    cloneWithOnUpdate(references, onUpdate) {
      return freeze({
        ...references,
        onUpdate,
      })
    },
  })
