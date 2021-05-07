import { freeze } from '../utils/object-utils'
import { ColumnNode } from './column-node'
import { OperationNode } from './operation-node'
import { PrimitiveValueListNode } from './primitive-value-list-node'
import { ReturningNode } from './returning-node'
import { TableNode } from './table-node'
import { ValueListNode } from './value-list-node'

export type InsertValuesNode = ValueListNode | PrimitiveValueListNode

export interface InsertQueryNode extends OperationNode {
  readonly kind: 'InsertQueryNode'
  readonly into: TableNode
  readonly columns?: ReadonlyArray<ColumnNode>
  readonly values?: ReadonlyArray<InsertValuesNode>
  readonly returning?: ReturningNode
}

export function isInsertQueryNode(
  node: OperationNode
): node is InsertQueryNode {
  return node.kind === 'InsertQueryNode'
}

export function createInsertQueryNodeWithTable(
  into: TableNode
): InsertQueryNode {
  return {
    kind: 'InsertQueryNode',
    into,
  }
}

export function cloneInsertQueryNodeWithColumnsAndValues(
  insertQuery: InsertQueryNode,
  columns: ReadonlyArray<ColumnNode>,
  values: ReadonlyArray<InsertValuesNode>
): InsertQueryNode {
  return freeze({
    ...insertQuery,
    columns,
    values,
  })
}
