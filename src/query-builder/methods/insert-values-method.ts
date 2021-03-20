import { ColumnNode, createColumnNode } from '../../operation-node/column-node'
import { InsertValuesNode } from '../../operation-node/insert-node'
import { isOperationNodeSource } from '../../operation-node/operation-node-source'
import { createPrimitiveValueListNode } from '../../operation-node/primitive-value-list-node'
import {
  createValueListNode,
  ListNodeItem,
} from '../../operation-node/value-list-node'
import { createValueNode } from '../../operation-node/value-node'
import { RawBuilder } from '../../raw-builder/raw-builder'
import { isPrimitive, PrimitiveValue } from '../../utils/object-utils'
import { AnyQueryBuilder, RowType } from '../type-utils'

export type InsertValuesArg<DB, TB extends keyof DB, R = RowType<DB, TB>> = {
  [C in keyof R]?: R[C] | AnyQueryBuilder | RawBuilder<any>
}

export interface InsertResultTypeTag {
  __isInsertResultTypeTag__: boolean
}

type InsertValueType = PrimitiveValue | AnyQueryBuilder | RawBuilder<any>

export function parseInsertValuesArgs(
  args: any
): [ReadonlyArray<ColumnNode>, ReadonlyArray<InsertValuesNode>] {
  return parseInsertColumnsAndValues(Array.isArray(args) ? args : [args])
}
function parseInsertColumnsAndValues(
  rows: InsertValuesArg<any, any>[]
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
    const rowValues: InsertValueType[] = columns.map(() => null)

    for (const column of Object.keys(row)) {
      const columnIdx = columns.indexOf(column)
      rowValues[columnIdx] = row[column]
    }

    if (rowValues.every(isPrimitive)) {
      values.push(createPrimitiveValueListNode(rowValues))
    } else {
      values.push(createValueListNode(rowValues.map(parseValue)))
    }
  }

  return [columns.map(createColumnNode), values]
}

function parseValue(value: InsertValueType): ListNodeItem {
  if (isPrimitive(value)) {
    return createValueNode(value)
  } else if (isOperationNodeSource(value)) {
    return value.toOperationNode()
  } else {
    throw new Error(
      `unsupported value for insert object ${JSON.stringify(value)}`
    )
  }
}
