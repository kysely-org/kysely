import { AliasNode, createAliasNode } from '../../operation-node/alias-node'
import { ColumnNode, createColumnNode } from '../../operation-node/column-node'
import { isOperationNodeSource } from '../../operation-node/operation-node-source'
import { ReferenceExpressionNode } from '../../operation-node/operation-node-utils'
import {
  createReferenceNode,
  ReferenceNode,
} from '../../operation-node/reference-node'
import {
  createTableNode,
  createTableNodeWithSchema,
} from '../../operation-node/table-node'
import { RawBuilder } from '../../raw-builder/raw-builder'
import { isFunction, isString } from '../../utils/object-utils'
import { QueryBuilder } from '../query-builder'
import {
  AnyColumn,
  AnyColumnWithTable,
  AnyQueryBuilder,
  QueryBuilderFactory,
  RawBuilderFactory,
} from '../type-utils'

export type ReferenceExpression<DB, TB extends keyof DB, O> =
  | AnyColumn<DB, TB>
  | AnyColumnWithTable<DB, TB>
  | AnyQueryBuilder
  | QueryBuilderFactory<DB, TB, O>
  | RawBuilder<any>
  | RawBuilderFactory<DB, TB, O>

export function parseReferenceExpression(
  arg: ReferenceExpression<any, any, any>
): ReferenceExpressionNode {
  if (isString(arg)) {
    return parseStringReference(arg)
  } else if (isOperationNodeSource(arg)) {
    return arg.toOperationNode()
  } else if (isFunction(arg)) {
    return arg(new QueryBuilder()).toOperationNode()
  } else {
    throw new Error(
      `unsupported left hand side filter argument ${JSON.stringify(arg)}`
    )
  }
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
