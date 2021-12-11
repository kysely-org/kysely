import { ColumnNode } from '../operation-node/column-node.js'
import { InsertValuesNode } from '../operation-node/insert-query-node.js'
import { PrimitiveValueListNode } from '../operation-node/primitive-value-list-node.js'
import { ValueListNode } from '../operation-node/value-list-node.js'
import { GeneratedPlaceholder } from '../util/type-utils.js'
import { isGeneratedPlaceholder } from '../util/generated-placeholder.js'
import { isPrimitive, PrimitiveValue } from '../util/object-utils.js'
import { ParseContext } from './parse-context.js'
import { parseValueExpression, ValueExpression } from './value-parser.js'

export type InsertObject<DB, TB extends keyof DB> = {
  [C in keyof DB[TB]]: InsertValueExpression<DB, TB, DB[TB][C]>
}

export type InsertObjectOrList<DB, TB extends keyof DB> =
  | InsertObject<DB, TB>
  | ReadonlyArray<InsertObject<DB, TB>>

type InsertValueExpression<DB, TB extends keyof DB, T> =
  | ValueExpression<DB, TB, T>
  | GeneratedPlaceholder

export function parseInsertObjectOrList(
  ctx: ParseContext,
  args: InsertObjectOrList<any, any>
): [ReadonlyArray<ColumnNode>, ReadonlyArray<InsertValuesNode>] {
  return parseInsertColumnsAndValues(ctx, Array.isArray(args) ? args : [args])
}

function parseInsertColumnsAndValues(
  ctx: ParseContext,
  rows: InsertObject<any, any>[]
): [ReadonlyArray<ColumnNode>, ReadonlyArray<InsertValuesNode>] {
  const columns = parseColumnNamesAndIndexes(rows)

  return [
    [...columns.keys()].map(ColumnNode.create),
    rows.map((row) => parseRowValues(ctx, row, columns)),
  ]
}

function parseColumnNamesAndIndexes(
  rows: InsertObject<any, any>[]
): Map<string, number> {
  const columns = new Map<string, number>()

  for (const row of rows) {
    const cols = Object.keys(row)

    for (const col of cols) {
      if (!columns.has(col) && !isGeneratedPlaceholder(row[col])) {
        columns.set(col, columns.size)
      }
    }
  }

  return columns
}

function parseRowValues(
  ctx: ParseContext,
  row: InsertObject<any, any>,
  columns: Map<string, number>
): PrimitiveValueListNode | ValueListNode {
  const rowColumns = Object.keys(row)

  const rowValues: ValueExpression<any, any, PrimitiveValue>[] = new Array(
    columns.size
  ).fill(null)

  for (const col of rowColumns) {
    const columnIdx = columns.get(col)
    const value = row[col]

    if (columnIdx !== undefined && !isGeneratedPlaceholder(value)) {
      rowValues[columnIdx] = value
    }
  }

  if (rowValues.every(isPrimitive)) {
    return PrimitiveValueListNode.create(rowValues)
  }

  return ValueListNode.create(
    rowValues.map((it) => parseValueExpression(ctx, it))
  )
}
