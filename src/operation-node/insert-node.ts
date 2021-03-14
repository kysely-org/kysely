import { AliasNode } from './alias-node'
import { ColumnNode } from './column-node'
import { OperationNode } from './operation-node'
import { PrimitiveValueListNode } from './primitive-value-list-node'
import { TableNode } from './table-node'
import { ValueListNode } from './value-list-node'

export type InsertIntoNode = TableNode | AliasNode
export type InsertValuesNode = ValueListNode | PrimitiveValueListNode

export interface InsertNode extends OperationNode {
  readonly kind: 'InsertNode'
  readonly into: TableNode | AliasNode
  readonly columns: ReadonlyArray<ColumnNode>
  readonly values: ReadonlyArray<InsertValuesNode>
}

export function isInsertNode(node: OperationNode): node is InsertNode {
  return node.kind === 'InsertNode'
}

export function createInsertNode(
  into: InsertIntoNode,
  columns: ReadonlyArray<ColumnNode>,
  values: ReadonlyArray<InsertValuesNode>
): InsertNode {
  return {
    kind: 'InsertNode',
    into,
    columns,
    values,
  }
}
