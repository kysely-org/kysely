import type { OperationNode } from './operation-node.js'
import type { ColumnNode } from './column-node.js'
import type { TableNode } from './table-node.js'
import { freeze, isString } from '../util/object-utils.js'

export type OnModifyForeignAction =
  | 'cascade'
  | 'no action'
  | 'restrict'
  | 'set default'
  | 'set null'

const ON_MODIFY_FOREIGN_ACTIONS_DICTIONARY: Readonly<
  Record<OnModifyForeignAction, true>
> = freeze({
  cascade: true,
  'no action': true,
  restrict: true,
  'set default': true,
  'set null': true,
})

/**
 * @deprecated will be removed in version 0.30.x
 */
export const ON_MODIFY_FOREIGN_ACTIONS: readonly OnModifyForeignAction[] =
  Object.keys(ON_MODIFY_FOREIGN_ACTIONS_DICTIONARY) as never

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

export function isOnModifyForeignAction(
  thing: unknown,
): thing is OnModifyForeignAction {
  return isString(thing) && ON_MODIFY_FOREIGN_ACTIONS_DICTIONARY[thing as never]
}
