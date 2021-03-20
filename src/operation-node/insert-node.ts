import { ColumnNode } from './column-node'
import { OperationNode } from './operation-node'
import { PrimitiveValueListNode } from './primitive-value-list-node'
import { TableNode } from './table-node'
import { ValueListNode } from './value-list-node'

export type InsertValuesNode = ValueListNode | PrimitiveValueListNode

export interface InsertNode extends OperationNode {
  readonly kind: 'InsertNode'
  readonly into: TableNode
  readonly columns?: ReadonlyArray<ColumnNode>
  readonly values?: ReadonlyArray<InsertValuesNode>
}

export function isInsertNode(node: OperationNode): node is InsertNode {
  return node.kind === 'InsertNode'
}

export function createInsertNodeWithTable(into: TableNode): InsertNode {
  return {
    kind: 'InsertNode',
    into,
  }
}

export function cloneInsertNodeWithColumnsAndValues(
  insert: InsertNode,
  columns: ReadonlyArray<ColumnNode>,
  values: ReadonlyArray<InsertValuesNode>
): InsertNode {
  return {
    ...insert,
    columns,
    values,
  }
}
