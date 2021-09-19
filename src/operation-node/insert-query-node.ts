import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { ColumnUpdateNode } from './column-update-node.js'
import { OnConflictNode, onConflictNode } from './on-conflict-node.js'
import { OperationNode } from './operation-node.js'
import { PrimitiveValueListNode } from './primitive-value-list-node.js'
import { ReturningNode } from './returning-node.js'
import { TableNode } from './table-node.js'
import { ValueListNode } from './value-list-node.js'
import { WithNode } from './with-node.js'

export type InsertValuesNode = ValueListNode | PrimitiveValueListNode

export interface InsertQueryNode extends OperationNode {
  readonly kind: 'InsertQueryNode'
  readonly into: TableNode
  readonly columns?: ReadonlyArray<ColumnNode>
  readonly values?: ReadonlyArray<InsertValuesNode>
  readonly returning?: ReturningNode
  readonly onConflict?: OnConflictNode
  readonly with?: WithNode
}

/**
 * @internal
 */
export const insertQueryNode = freeze({
  is(node: OperationNode): node is InsertQueryNode {
    return node.kind === 'InsertQueryNode'
  },

  create(into: TableNode, withNode?: WithNode): InsertQueryNode {
    return freeze({
      kind: 'InsertQueryNode',
      into,
      ...(withNode && { with: withNode }),
    })
  },

  cloneWithColumnsAndValues(
    insertQuery: InsertQueryNode,
    columns: ReadonlyArray<ColumnNode>,
    values: ReadonlyArray<InsertValuesNode>
  ): InsertQueryNode {
    return freeze({
      ...insertQuery,
      columns,
      values,
    })
  },

  cloneWithOnConflictDoNothing(
    insertQuery: InsertQueryNode,
    columns: ReadonlyArray<ColumnNode>
  ): InsertQueryNode {
    return freeze({
      ...insertQuery,
      onConflict: onConflictNode.createWithDoNothing(columns),
    })
  },

  cloneWithOnConflictUpdate(
    insertQuery: InsertQueryNode,
    columns: ReadonlyArray<ColumnNode>,
    updates: ReadonlyArray<ColumnUpdateNode>
  ): InsertQueryNode {
    return freeze({
      ...insertQuery,
      onConflict: onConflictNode.createWithUpdates(columns, updates),
    })
  },
})
