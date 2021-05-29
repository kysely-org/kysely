import { ColumnNode, createColumnNode } from '../operation-node/column-node'
import { InsertValuesNode } from '../operation-node/insert-query-node'
import { isOperationNodeSource } from '../operation-node/operation-node-source'
import { createPrimitiveValueListNode } from '../operation-node/primitive-value-list-node'
import {
  createValueListNode,
  ListNodeItem,
} from '../operation-node/value-list-node'
import { createValueNode } from '../operation-node/value-node'
import { RawBuilder } from '../raw-builder/raw-builder'
import { isPrimitive, PrimitiveValue } from '../utils/object-utils'
import { AnyQueryBuilder } from '../query-builder/type-utils'
import { isMutatingQueryNode } from '../operation-node/query-node-utils'
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
      values.push(createPrimitiveValueListNode(rowValues))
    } else {
      values.push(
        createValueListNode(rowValues.map(parseMutationValueExpression))
      )
    }
  }

  return [columns.map(createColumnNode), values]
}
