import { ColumnNode, columnNode } from '../operation-node/column-node'
import { InsertValuesNode } from '../operation-node/insert-query-node'
import { primitiveValueListNode } from '../operation-node/primitive-value-list-node'
import { valueListNode } from '../operation-node/value-list-node'
import { isPrimitive, PrimitiveValue } from '../util/object-utils'
import {
  MutationObject,
  MutationValueExpression,
  parseMutationValueExpression,
} from './mutation-parser'

export function parseInsertValuesArgs(
  args: any
): [ReadonlyArray<ColumnNode>, ReadonlyArray<InsertValuesNode>] {
  return parseInsertColumnsAndValues(Array.isArray(args) ? args : [args])
}

function parseInsertColumnsAndValues(
  rows: MutationObject<any, any>[]
): [ReadonlyArray<ColumnNode>, ReadonlyArray<InsertValuesNode>] {
  const columns: string[] = []
  const values: InsertValuesNode[] = []

  for (const row of rows) {
    for (const column of Object.keys(row)) {
      if (!columns.includes(column)) {
        columns.push(column)
      }
    }
  }

  for (const row of rows) {
    const rowValues: MutationValueExpression<PrimitiveValue>[] = columns.map(
      () => null
    )

    for (const column of Object.keys(row)) {
      const columnIdx = columns.indexOf(column)
      rowValues[columnIdx] = row[column]
    }

    if (rowValues.every(isPrimitive)) {
      values.push(primitiveValueListNode.create(rowValues))
    } else {
      values.push(
        valueListNode.create(rowValues.map(parseMutationValueExpression))
      )
    }
  }

  return [columns.map(columnNode.create), values]
}
