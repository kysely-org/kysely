import { ColumnNode } from '../operation-node/column-node.js'
import { InsertValuesNode } from '../operation-node/insert-query-node.js'
import { PrimitiveValueListNode } from '../operation-node/primitive-value-list-node.js'
import { ValueListNode } from '../operation-node/value-list-node.js'
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

export type InsertObjectOrList<DB, TB extends keyof DB> =
  | InsertObject<DB, TB>
  | InsertObject<DB, TB>[]

type InsertValueExpression<T extends PrimitiveValue> =
  | T
  | AnyQueryBuilder
  | AnyRawBuilder
  | GeneratedPlaceholder

export function parseInsertObjectOrList(
  args: InsertObjectOrList<any, any>
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
      values.push(PrimitiveValueListNode.create(rowValues))
    } else {
      values.push(
        ValueListNode.create(rowValues.map(parseMutationValueExpression))
      )
    }
  }

  return [columns.map(ColumnNode.create), values]
}
