import { AliasNode } from '../operation-node/alias-node.js'
import { ColumnNode } from '../operation-node/column-node.js'
import { ReferenceExpressionNode } from '../operation-node/operation-node-utils.js'
import { ReferenceNode } from '../operation-node/reference-node.js'
import { TableNode } from '../operation-node/table-node.js'
import {
  isReadonlyArray,
  isString,
  PrimitiveValue,
} from '../util/object-utils.js'
import {
  AnyColumn,
  AnyColumnWithTable,
  ExtractColumnType,
  ValueType,
} from '../util/type-utils.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'
import { SelectQueryBuilder } from '../query-builder/select-query-builder.js'
import { ParseContext } from './parse-context.js'
import {
  parseComplexExpression,
  ComplexExpression,
} from './complex-expression-parser.js'
import {
  DynamicReferenceBuilder,
  isDynamicReferenceBuilder,
} from '../dynamic/dynamic-reference-builder.js'

export type ReferenceExpression<DB, TB extends keyof DB> =
  | StringReference<DB, TB>
  | DynamicReferenceBuilder<any>
  | ComplexExpression<DB, TB>

export type ReferenceExpressionOrList<DB, TB extends keyof DB> =
  | ReferenceExpression<DB, TB>
  | ReadonlyArray<ReferenceExpression<DB, TB>>

export type StringReference<DB, TB extends keyof DB> =
  | AnyColumn<DB, TB>
  | AnyColumnWithTable<DB, TB>

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
  : RE extends SelectQueryBuilder<any, any, infer O>
  ? ValueType<O>
  : RE extends (qb: any) => SelectQueryBuilder<any, any, infer O>
  ? ValueType<O>
  : PrimitiveValue

type ExtractTypeFromStringReference<
  DB,
  TB extends keyof DB,
  RE extends string
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
  : PrimitiveValue

export function parseReferenceExpressionOrList(
  ctx: ParseContext,
  arg: ReferenceExpressionOrList<any, any>
): ReferenceExpressionNode[] {
  if (isReadonlyArray(arg)) {
    return arg.map((it) => parseReferenceExpression(ctx, it))
  } else {
    return [parseReferenceExpression(ctx, arg)]
  }
}

export function parseReferenceExpression(
  ctx: ParseContext,
  exp: ReferenceExpression<any, any>
): ReferenceExpressionNode {
  if (isString(exp)) {
    return parseStringReference(exp)
  } else if (isDynamicReferenceBuilder(exp)) {
    return exp.toOperationNode()
  }

  return parseComplexExpression(ctx, exp)
}

export function parseStringReference(ref: string): ColumnNode | ReferenceNode {
  const COLUMN_SEPARATOR = '.'

  if (ref.includes(COLUMN_SEPARATOR)) {
    const parts = ref.split(COLUMN_SEPARATOR).map(trim)

    if (parts.length === 3) {
      return parseStringReferenceWithTableAndSchema(parts)
    } else if (parts.length === 2) {
      return parseStringReferenceWithTable(parts)
    } else {
      throw new Error(`invalid column reference ${ref}`)
    }
  } else {
    return ColumnNode.create(ref)
  }
}

export function parseAliasedStringReference(
  ref: string
): ColumnNode | ReferenceNode | AliasNode {
  const ALIAS_SEPARATOR = ' as '

  if (ref.includes(ALIAS_SEPARATOR)) {
    const [columnRef, alias] = ref.split(ALIAS_SEPARATOR).map(trim)

    return AliasNode.create(parseStringReference(columnRef), alias)
  } else {
    return parseStringReference(ref)
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

function trim(str: string): string {
  return str.trim()
}
