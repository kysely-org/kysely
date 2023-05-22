import { AliasNode } from '../operation-node/alias-node.js'
import { ColumnNode } from '../operation-node/column-node.js'
import { ReferenceNode } from '../operation-node/reference-node.js'
import { TableNode } from '../operation-node/table-node.js'
import { isReadonlyArray, isString } from '../util/object-utils.js'
import {
  AnyColumn,
  AnyColumnWithTable,
  ExtractColumnType,
} from '../util/type-utils.js'
import { SelectQueryBuilder } from '../query-builder/select-query-builder.js'
import {
  parseExpression,
  ExpressionOrFactory,
  isExpressionOrFactory,
} from './expression-parser.js'
import { DynamicReferenceBuilder } from '../dynamic/dynamic-reference-builder.js'
import { SelectType } from '../util/column-type.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { Expression } from '../expression/expression.js'
import { SimpleReferenceExpressionNode } from '../operation-node/simple-reference-expression-node.js'
import {
  OrderByDirection,
  isOrderByDirection,
  parseOrderBy,
} from './order-by-parser.js'

export type StringReference<DB, TB extends keyof DB> =
  | AnyColumn<DB, TB>
  | AnyColumnWithTable<DB, TB>

export type SimpleReferenceExpression<DB, TB extends keyof DB> =
  | StringReference<DB, TB>
  | DynamicReferenceBuilder<any>

export type ReferenceExpression<DB, TB extends keyof DB> =
  | SimpleReferenceExpression<DB, TB>
  | ExpressionOrFactory<DB, TB, any>

export type ReferenceExpressionOrList<DB, TB extends keyof DB> =
  | ReferenceExpression<DB, TB>
  | ReadonlyArray<ReferenceExpression<DB, TB>>

export type ExtractTypeFromReferenceExpression<
  DB,
  TB extends keyof DB,
  RE,
  DV = unknown
> = RE extends string
  ? SelectType<ExtractTypeFromStringReference<DB, TB, RE>>
  : RE extends SelectQueryBuilder<any, any, infer O>
  ? O[keyof O] | null
  : RE extends (qb: any) => SelectQueryBuilder<any, any, infer O>
  ? O[keyof O] | null
  : RE extends Expression<infer O>
  ? O
  : RE extends (qb: any) => Expression<infer O>
  ? O
  : DV

export type ExtractTypeFromStringReference<
  DB,
  TB extends keyof DB,
  RE extends string,
  DV = unknown
> = RE extends `${infer SC}.${infer T}.${infer C}`
  ? `${SC}.${T}` extends TB
    ? C extends keyof DB[`${SC}.${T}`]
      ? DB[`${SC}.${T}`][C]
      : never
    : never
  : RE extends `${infer T}.${infer C}`
  ? T extends TB
    ? C extends keyof DB[T]
      ? DB[T][C]
      : never
    : never
  : RE extends AnyColumn<DB, TB>
  ? ExtractColumnType<DB, TB, RE>
  : DV

export type OrderedColumnName<C extends string> =
  C extends `${string} ${infer O}`
    ? O extends OrderByDirection
      ? C
      : never
    : C

export type ExtractColumnNameFromOrderedColumnName<C extends string> =
  C extends `${infer CL} ${infer O}`
    ? O extends OrderByDirection
      ? CL
      : never
    : C

export function parseSimpleReferenceExpression(
  exp: SimpleReferenceExpression<any, any>
): SimpleReferenceExpressionNode {
  if (isString(exp)) {
    return parseStringReference(exp)
  }

  return exp.toOperationNode()
}

export function parseReferenceExpressionOrList(
  arg: ReferenceExpressionOrList<any, any>
): OperationNode[] {
  if (isReadonlyArray(arg)) {
    return arg.map((it) => parseReferenceExpression(it))
  } else {
    return [parseReferenceExpression(arg)]
  }
}

export function parseReferenceExpression(
  exp: ReferenceExpression<any, any>
): OperationNode {
  if (isExpressionOrFactory(exp)) {
    return parseExpression(exp)
  }

  return parseSimpleReferenceExpression(exp)
}

export function parseStringReference(
  ref: string
): SimpleReferenceExpressionNode {
  const COLUMN_SEPARATOR = '.'

  if (!ref.includes(COLUMN_SEPARATOR)) {
    return ReferenceNode.create(ColumnNode.create(ref))
  }

  const parts = ref.split(COLUMN_SEPARATOR).map(trim)

  if (parts.length === 3) {
    return parseStringReferenceWithTableAndSchema(parts)
  }

  if (parts.length === 2) {
    return parseStringReferenceWithTable(parts)
  }

  throw new Error(`invalid column reference ${ref}`)
}

export function parseAliasedStringReference(
  ref: string
): SimpleReferenceExpressionNode | AliasNode {
  const ALIAS_SEPARATOR = ' as '

  if (ref.includes(ALIAS_SEPARATOR)) {
    const [columnRef, alias] = ref.split(ALIAS_SEPARATOR).map(trim)

    return AliasNode.create(
      parseStringReference(columnRef),
      IdentifierNode.create(alias)
    )
  } else {
    return parseStringReference(ref)
  }
}

export function parseColumnName(column: AnyColumn<any, any>): ColumnNode {
  return ColumnNode.create(column)
}

export function parseOrderedColumnName(column: string): OperationNode {
  const ORDER_SEPARATOR = ' '

  if (column.includes(ORDER_SEPARATOR)) {
    const [columnName, order] = column.split(ORDER_SEPARATOR).map(trim)

    if (!isOrderByDirection(order)) {
      throw new Error(
        `invalid order direction "${order}" next to "${columnName}"`
      )
    }

    return parseOrderBy(columnName, order)
  } else {
    return parseColumnName(column)
  }
}

function parseStringReferenceWithTableAndSchema(
  parts: string[]
): ReferenceNode {
  const [schema, table, column] = parts

  return ReferenceNode.create(
    ColumnNode.create(column),
    TableNode.createWithSchema(schema, table)
  )
}

function parseStringReferenceWithTable(parts: string[]): ReferenceNode {
  const [table, column] = parts

  return ReferenceNode.create(
    ColumnNode.create(column),
    TableNode.create(table)
  )
}

function trim(str: string): string {
  return str.trim()
}
