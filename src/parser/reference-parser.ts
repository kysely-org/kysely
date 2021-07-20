import { AliasNode, aliasNode } from '../operation-node/alias-node'
import { ColumnNode, columnNode } from '../operation-node/column-node'
import { isOperationNodeSource } from '../operation-node/operation-node-source'
import { ReferenceExpressionNode } from '../operation-node/operation-node-utils'
import { referenceNode, ReferenceNode } from '../operation-node/reference-node'
import { tableNode } from '../operation-node/table-node'
import { RawBuilder } from '../raw-builder/raw-builder'
import { isFunction, isString } from '../util/object-utils'
import {
  AnyColumn,
  AnyColumnWithTable,
  AnyQueryBuilder,
  QueryBuilderFactory,
  RawBuilderFactory,
} from '../query-builder/type-utils'
import { DynamicReferenceBuilder } from '../dynamic/dynamic-reference-builder'
import { queryNode } from '../operation-node/query-node'
import { SubQueryBuilder } from '../query-builder/sub-query-builder'

export type ReferenceExpression<DB, TB extends keyof DB> =
  | AnyColumn<DB, TB>
  | AnyColumnWithTable<DB, TB>
  | AnyQueryBuilder
  | QueryBuilderFactory<DB, TB>
  | RawBuilder<any>
  | RawBuilderFactory<DB, TB>
  | DynamicReferenceBuilder<any>

export type ReferenceExpressionOrList<DB, TB extends keyof DB> =
  | ReferenceExpression<DB, TB>
  | ReferenceExpression<DB, TB>[]

export function parseReferenceExpressionOrList(
  arg: ReferenceExpressionOrList<any, any>
): ReferenceExpressionNode[] {
  if (Array.isArray(arg)) {
    return arg.map(parseReferenceExpression)
  } else {
    return [parseReferenceExpression(arg)]
  }
}

export function parseReferenceExpression(
  arg: ReferenceExpression<any, any>
): ReferenceExpressionNode {
  if (isString(arg)) {
    return parseStringReference(arg)
  } else if (isOperationNodeSource(arg)) {
    const node = arg.toOperationNode()

    if (!queryNode.isMutating(node)) {
      return node
    }
  } else if (isFunction(arg)) {
    const node = arg(new SubQueryBuilder()).toOperationNode()

    if (!queryNode.isMutating(node)) {
      return node
    }
  }

  throw new Error(`invalid reference expression ${JSON.stringify(arg)}`)
}

export function parseStringReference(str: string): ColumnNode | ReferenceNode {
  if (str.includes('.')) {
    const parts = str.split('.').map((it) => it.trim())

    if (parts.length === 3) {
      return parseStringReferenceWithTableAndSchema(parts)
    } else if (parts.length === 2) {
      return parseStringReferenceWithTable(parts)
    } else {
      throw new Error(`invalid column reference ${str}`)
    }
  } else {
    return columnNode.create(str)
  }
}

export function parseAliasedStringReference(
  str: string
): ColumnNode | ReferenceNode | AliasNode {
  if (str.includes(' as ')) {
    const [tableColumn, alias] = str.split(' as ').map((it) => it.trim())
    const tableColumnNode = parseStringReference(tableColumn)
    return aliasNode.create(tableColumnNode, alias)
  } else {
    return parseStringReference(str)
  }
}

export function parseColumnName(column: AnyColumn<any, any>): ColumnNode {
  return columnNode.create(column as string)
}

function parseStringReferenceWithTableAndSchema(
  parts: string[]
): ReferenceNode {
  const [schema, table, column] = parts

  return referenceNode.create(
    tableNode.createWithSchema(schema, table),
    columnNode.create(column)
  )
}

function parseStringReferenceWithTable(parts: string[]): ReferenceNode {
  const [table, column] = parts

  return referenceNode.create(
    tableNode.create(table),
    columnNode.create(column)
  )
}
