import type { OperationNode } from './operation-node.js'
import type { ColumnNode } from './column-node.js'
import type { TableNode } from './table-node.js'
import { freeze } from '../util/object-utils.js'

export const ON_MODIFY_FOREIGN_ACTIONS_RECORD = {
  cascade: true,
  'no action': true,
  restrict: true,
  'set default': true,
  'set null': true,
} as const satisfies Record<string, true>

export const ON_MODIFY_FOREIGN_ACTIONS = Object.keys(
  ON_MODIFY_FOREIGN_ACTIONS_RECORD,
)

export type OnModifyForeignAction =
  keyof typeof ON_MODIFY_FOREIGN_ACTIONS_RECORD

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
