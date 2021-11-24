import { ColumnNode } from '../operation-node/column-node.js'
import { InsertValuesNode } from '../operation-node/insert-query-node.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { PrimitiveValueListNode } from '../operation-node/primitive-value-list-node.js'
import { QueryNode } from '../operation-node/query-node.js'
import { RawNode } from '../operation-node/raw-node.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import { ValueListNode } from '../operation-node/value-list-node.js'
import { ValueNode } from '../operation-node/value-node.js'
import {
  AnyQueryBuilder,
  AnyRawBuilder,
  GeneratedPlaceholder,
} from '../util/type-utils.js'
import { isGeneratedPlaceholder } from '../util/generated-placeholder.js'
import { isPrimitive, PrimitiveValue } from '../util/object-utils.js'

export type InsertObject<DB, TB extends keyof DB> = {
  [C in keyof DB[TB]]: InsertValueExpression<DB[TB][C]>
}

export type InsertObjectOrList<DB, TB extends keyof DB> =
  | InsertObject<DB, TB>
  | ReadonlyArray<InsertObject<DB, TB>>

type InsertValueExpression<T> =
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
    const rowValues: InsertValueExpression<PrimitiveValue>[] = columns.map(
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
        ValueListNode.create(rowValues.map(parseInsertValueExpression))
      )
    }
  }

  return [columns.map(ColumnNode.create), values]
}

export function parseInsertValueExpression(
  value: InsertValueExpression<PrimitiveValue>
): ValueNode | RawNode | SelectQueryNode {
  if (isPrimitive(value)) {
    return ValueNode.create(value)
  } else if (isOperationNodeSource(value)) {
    const node = value.toOperationNode()

    if (!QueryNode.isMutating(node)) {
      return node
    }
  }

  throw new Error(
    `unsupported value for insert object ${JSON.stringify(value)}`
  )
}
