import { ColumnNode, columnNode } from '../operation-node/column-node.js'
import { InsertValuesNode } from '../operation-node/insert-query-node.js'
import { primitiveValueListNode } from '../operation-node/primitive-value-list-node.js'
import { valueListNode } from '../operation-node/value-list-node.js'
import {
  AnyQueryBuilder,
  AnyRawBuilder,
  GeneratedPlaceholder,
} from '../query-builder/type-utils.js'
import { isGeneratedPlaceholder } from '../util/generated-placeholder.js'
import { isPrimitive, PrimitiveValue } from '../util/object-utils.js'
import {
  MutationValueExpression,
  parseMutationValueExpression,
} from './mutation-parser.js'

export type InsertObject<DB, TB extends keyof DB> = {
  [C in keyof DB[TB]]: InsertValueExpression<DB[TB][C]>
}

type InsertValueExpression<T extends PrimitiveValue> =
  | T
  | AnyQueryBuilder
  | AnyRawBuilder
  | GeneratedPlaceholder

export function parseInsertValuesArgs(
  args: InsertObject<any, any> | InsertObject<any, any>[]
): [ReadonlyArray<ColumnNode>, ReadonlyArray<InsertValuesNode>] {
  return parseInsertColumnsAndValues(Array.isArray(args) ? args : [args])
}

function parseInsertColumnsAndValues(
  rows: InsertObject<any, any>[]
): [ReadonlyArray<ColumnNode>, ReadonlyArray<InsertValuesNode>] {
  const columns: string[] = []
  const values: InsertValuesNode[] = []

  for (const row of rows) {
    for (const column of Object.keys(row)) {
      const value = row[column]

      if (!columns.includes(column) && !isGeneratedPlaceholder(value)) {
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

      if (columnIdx !== -1) {
        rowValues[columnIdx] = row[column]
      }
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
