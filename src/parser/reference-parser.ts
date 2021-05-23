import { AliasNode, createAliasNode } from '../operation-node/alias-node'
import { ColumnNode, createColumnNode } from '../operation-node/column-node'
import { isDeleteQueryNode } from '../operation-node/delete-query-node'
import { isInsertQueryNode } from '../operation-node/insert-query-node'
import { isOperationNodeSource } from '../operation-node/operation-node-source'
import { ReferenceExpressionNode } from '../operation-node/operation-node-utils'
import {
  createReferenceNode,
  ReferenceNode,
} from '../operation-node/reference-node'
import {
  createTableNode,
  createTableNodeWithSchema,
} from '../operation-node/table-node'
import { RawBuilder } from '../raw-builder/raw-builder'
import { isFunction, isString } from '../utils/object-utils'
import { createEmptySelectQuery } from '../query-builder/query-builder'
import {
  AnyColumn,
  AnyColumnWithTable,
  AnyQueryBuilder,
  QueryBuilderFactory,
  RawBuilderFactory,
} from '../query-builder/type-utils'
import { DynamicReferenceBuilder } from '../dynamic/dynamic-reference-builder'

export type ReferenceExpression<DB, TB extends keyof DB, O> =
  | AnyColumn<DB, TB>
  | AnyColumnWithTable<DB, TB>
  | AnyQueryBuilder
  | QueryBuilderFactory<DB, TB, O>
  | RawBuilder<any>
  | RawBuilderFactory<DB, TB, O>
  | DynamicReferenceBuilder<any>

export type ReferenceExpressionOrList<DB, TB extends keyof DB, O> =
  | ReferenceExpression<DB, TB, O>
  | ReferenceExpression<DB, TB, O>[]

export function parseReferenceExpressionOrList(
  arg: ReferenceExpressionOrList<any, any, any>
): ReferenceExpressionNode[] {
  if (Array.isArray(arg)) {
    return arg.map(parseReferenceExpression)
  } else {
    return [parseReferenceExpression(arg)]
  }
}

export function parseReferenceExpression(
  arg: ReferenceExpression<any, any, any>
): ReferenceExpressionNode {
  if (isString(arg)) {
    return parseStringReference(arg)
  } else if (isOperationNodeSource(arg)) {
    const node = arg.toOperationNode()

    if (!isDeleteQueryNode(node) && !isInsertQueryNode(node)) {
      return node
    }
  } else if (isFunction(arg)) {
    const node = arg(createEmptySelectQuery()).toOperationNode()

    if (!isDeleteQueryNode(node) && !isInsertQueryNode(node)) {
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
    return createColumnNode(str)
  }
}

export function parseAliasedStringReference(
  str: string
): ColumnNode | ReferenceNode | AliasNode {
  if (str.includes(' as ')) {
    const [tableColumn, alias] = str.split(' as ').map((it) => it.trim())
    const tableColumnNode = parseStringReference(tableColumn)
    return createAliasNode(tableColumnNode, alias)
  } else {
    return parseStringReference(str)
  }
}

function parseStringReferenceWithTableAndSchema(
  parts: string[]
): ReferenceNode {
  const [schema, table, column] = parts

  return createReferenceNode(
    createTableNodeWithSchema(schema, table),
    createColumnNode(column)
  )
}

function parseStringReferenceWithTable(parts: string[]): ReferenceNode {
  const [table, column] = parts
  return createReferenceNode(createTableNode(table), createColumnNode(column))
}
