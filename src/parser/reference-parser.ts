import { AliasNode } from '../operation-node/alias-node.js'
import { ColumnNode } from '../operation-node/column-node.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { ReferenceExpressionNode } from '../operation-node/operation-node-utils.js'
import { ReferenceNode } from '../operation-node/reference-node.js'
import { TableNode } from '../operation-node/table-node.js'
import { isFunction, isString, PrimitiveValue } from '../util/object-utils.js'
import {
  AnyColumn,
  AnyColumnWithTable,
  AnyQueryBuilder,
  AnyRawBuilder,
  QueryBuilderFactory,
  RawBuilderFactory,
  RowType,
  ValueType,
} from '../query-builder/type-utils.js'
import { DynamicReferenceBuilder } from '../dynamic/dynamic-reference-builder.js'
import { QueryNode } from '../operation-node/query-node.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'
import { QueryBuilder } from '../query-builder/query-builder.js'
import { ParseContext } from './parse-context.js'

export type ReferenceExpression<DB, TB extends keyof DB> =
  | AnyColumn<DB, TB>
  | AnyColumnWithTable<DB, TB>
  | AnyQueryBuilder
  | QueryBuilderFactory<DB, TB>
  | AnyRawBuilder
  | RawBuilderFactory<DB, TB>
  | DynamicReferenceBuilder<any>

export type ReferenceExpressionOrList<DB, TB extends keyof DB> =
  | ReferenceExpression<DB, TB>
  | ReferenceExpression<DB, TB>[]

export type ExtractTypeFromReferenceExpression<
  DB,
  TB extends keyof DB,
  RE
> = RE extends string
  ? ExtractTypeFromStringReference<DB, TB, RE>
  : RE extends RawBuilder<infer O>
  ? O
  : RE extends (qb: any) => RawBuilder<infer O>
  ? O
  : RE extends QueryBuilder<any, any, infer O>
  ? ValueType<O>
  : RE extends (qb: any) => QueryBuilder<any, any, infer O>
  ? ValueType<O>
  : PrimitiveValue

type ExtractTypeFromStringReference<
  DB,
  TB extends keyof DB,
  S extends string,
  R = RowType<DB, TB>
> = S extends `${infer SC}.${infer T}.${infer C}`
  ? `${SC}.${T}` extends TB
    ? C extends keyof DB[`${SC}.${T}`]
      ? DB[`${SC}.${T}`][C]
      : never
    : never
  : S extends `${infer T}.${infer C}`
  ? T extends TB
    ? C extends keyof DB[T]
      ? DB[T][C]
      : never
    : never
  : S extends keyof R
  ? R[S]
  : PrimitiveValue

export function parseReferenceExpressionOrList(
  ctx: ParseContext,
  arg: ReferenceExpressionOrList<any, any>
): ReferenceExpressionNode[] {
  if (Array.isArray(arg)) {
    return arg.map((it) => parseReferenceExpression(ctx, it))
  } else {
    return [parseReferenceExpression(ctx, arg)]
  }
}

export function parseReferenceExpression(
  ctx: ParseContext,
  arg: ReferenceExpression<any, any>
): ReferenceExpressionNode {
  if (isString(arg)) {
    return parseStringReference(arg)
  } else if (isOperationNodeSource(arg)) {
    const node = arg.toOperationNode()

    if (!QueryNode.isMutating(node)) {
      return node
    }
  } else if (isFunction(arg)) {
    const node = arg(ctx.createExpressionBuilder()).toOperationNode()

    if (!QueryNode.isMutating(node)) {
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
    return ColumnNode.create(str)
  }
}

export function parseAliasedStringReference(
  str: string
): ColumnNode | ReferenceNode | AliasNode {
  if (str.includes(' as ')) {
    const [tableColumn, alias] = str.split(' as ').map((it) => it.trim())
    const tableColumnNode = parseStringReference(tableColumn)
    return AliasNode.create(tableColumnNode, alias)
  } else {
    return parseStringReference(str)
  }
}

export function parseColumnName(column: AnyColumn<any, any>): ColumnNode {
  return ColumnNode.create(column as string)
}

function parseStringReferenceWithTableAndSchema(
  parts: string[]
): ReferenceNode {
  const [schema, table, column] = parts

  return ReferenceNode.create(
    TableNode.createWithSchema(schema, table),
    ColumnNode.create(column)
  )
}

function parseStringReferenceWithTable(parts: string[]): ReferenceNode {
  const [table, column] = parts

  return ReferenceNode.create(
    TableNode.create(table),
    ColumnNode.create(column)
  )
}
