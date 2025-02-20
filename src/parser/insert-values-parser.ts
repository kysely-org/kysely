import { ColumnNode } from '../operation-node/column-node.js'
import { PrimitiveValueListNode } from '../operation-node/primitive-value-list-node.js'
import { ValueListNode } from '../operation-node/value-list-node.js'
import {
  freeze,
  isFunction,
  isReadonlyArray,
  isUndefined,
} from '../util/object-utils.js'
import { parseValueExpression, ValueExpression } from './value-parser.js'
import { ValuesNode } from '../operation-node/values-node.js'
import {
  NonNullableInsertKeys,
  NullableInsertKeys,
  InsertType,
} from '../util/column-type.js'
import { isExpressionOrFactory } from './expression-parser.js'
import { DefaultInsertValueNode } from '../operation-node/default-insert-value-node.js'
import {
  expressionBuilder,
  ExpressionBuilder,
} from '../expression/expression-builder.js'

export type InsertObject<DB, TB extends keyof DB> = {
  [C in NonNullableInsertKeys<DB[TB]>]: ValueExpression<
    DB,
    TB,
    InsertType<DB[TB][C]>
  >
} & {
  [C in NullableInsertKeys<DB[TB]>]?:
    | ValueExpression<DB, TB, InsertType<DB[TB][C]>>
    | undefined
}

type NonEmptyArray<T> = [T, ...T[]]
export type InsertObjectOrList<DB, TB extends keyof DB> =
  | InsertObject<DB, TB>
  | Readonly<NonEmptyArray<InsertObject<DB, TB>>>

export type InsertObjectOrListFactory<
  DB,
  TB extends keyof DB,
  UT extends keyof DB = never,
> = (eb: ExpressionBuilder<DB, TB | UT>) => InsertObjectOrList<DB, TB>

export type InsertExpression<
  DB,
  TB extends keyof DB,
  UT extends keyof DB = never,
> = InsertObjectOrList<DB, TB> | InsertObjectOrListFactory<DB, TB, UT>

export function parseInsertExpression(
  arg: InsertExpression<any, any, any>,
): [ReadonlyArray<ColumnNode>, ValuesNode] {
  const objectOrList = isFunction(arg) ? arg(expressionBuilder()) : arg
  const list = isReadonlyArray(objectOrList)
    ? objectOrList
    : freeze([objectOrList])

  return parseInsertColumnsAndValues(list)
}

function parseInsertColumnsAndValues(
  rows: ReadonlyArray<InsertObject<any, any>>,
): [ReadonlyArray<ColumnNode>, ValuesNode] {
  const columns = parseColumnNamesAndIndexes(rows)

  return [
    freeze([...columns.keys()].map(ColumnNode.create)),
    ValuesNode.create(rows.map((row) => parseRowValues(row, columns))),
  ]
}

function parseColumnNamesAndIndexes(
  rows: ReadonlyArray<InsertObject<any, any>>,
): Map<string, number> {
  const columns = new Map<string, number>()

  for (const row of rows) {
    const cols = Object.keys(row)

    for (const col of cols) {
      if (!columns.has(col) && row[col] !== undefined) {
        columns.set(col, columns.size)
      }
    }
  }

  return columns
}

function parseRowValues(
  row: InsertObject<any, any>,
  columns: Map<string, number>,
): PrimitiveValueListNode | ValueListNode {
  const rowColumns = Object.keys(row)

  const rowValues = Array.from({
    length: columns.size,
  })

  let hasUndefinedOrComplexColumns = false
  let indexedRowColumns = rowColumns.length

  for (const col of rowColumns) {
    const columnIdx = columns.get(col)

    if (isUndefined(columnIdx)) {
      indexedRowColumns--
      continue
    }

    const value = row[col]

    if (isUndefined(value) || isExpressionOrFactory(value)) {
      hasUndefinedOrComplexColumns = true
    }

    rowValues[columnIdx] = value
  }

  const hasMissingColumns = indexedRowColumns < columns.size

  if (hasMissingColumns || hasUndefinedOrComplexColumns) {
    const defaultValue = DefaultInsertValueNode.create()

    return ValueListNode.create(
      rowValues.map((it) =>
        isUndefined(it) ? defaultValue : parseValueExpression(it),
      ),
    )
  }

  return PrimitiveValueListNode.create(rowValues)
}
