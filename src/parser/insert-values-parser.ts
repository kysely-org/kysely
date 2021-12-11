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
  QueryBuilderFactory,
  RawBuilderFactory,
} from '../util/type-utils.js'
import { isGeneratedPlaceholder } from '../util/generated-placeholder.js'
import {
  isFunction,
  isPrimitive,
  PrimitiveValue,
} from '../util/object-utils.js'
import { ParseContext } from './parse-context.js'

export type InsertObject<DB, TB extends keyof DB> = {
  [C in keyof DB[TB]]: InsertValueExpression<DB, TB, DB[TB][C]>
}

export type InsertObjectOrList<DB, TB extends keyof DB> =
  | InsertObject<DB, TB>
  | ReadonlyArray<InsertObject<DB, TB>>

type InsertValueExpression<DB, TB extends keyof DB, T> =
  | T
  | AnyQueryBuilder
  | QueryBuilderFactory<DB, TB>
  | AnyRawBuilder
  | RawBuilderFactory<DB, TB>
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
    const rowValues: InsertValueExpression<any, any, PrimitiveValue>[] =
      columns.map(() => null)

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
        ValueListNode.create(
          rowValues.map((it) => parseInsertValueExpression(ctx, it))
        )
      )
    }
  }

  return [columns.map(ColumnNode.create), values]
}

export function parseInsertValueExpression(
  ctx: ParseContext,
  value: InsertValueExpression<any, any, PrimitiveValue>
): ValueNode | RawNode | SelectQueryNode {
  if (isPrimitive(value)) {
    return ValueNode.create(value)
  } else if (isOperationNodeSource(value)) {
    const node = value.toOperationNode()

    if (!QueryNode.isMutating(node)) {
      return node
    }
  } else if (isFunction(value)) {
    const node = value(ctx.createExpressionBuilder()).toOperationNode()

    if (!QueryNode.isMutating(node)) {
      return node
    }
  }

  throw new Error(
    `unsupported value for insert object ${JSON.stringify(value)}`
  )
}
