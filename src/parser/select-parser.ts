import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { AliasedRawBuilder } from '../raw-builder/raw-builder.js'
import { isFunction, isReadonlyArray, isString } from '../util/object-utils.js'
import {
  AliasedQueryBuilder,
  QueryBuilder,
} from '../query-builder/query-builder.js'
import { SelectionNode } from '../operation-node/selection-node.js'
import {
  AliasedQueryBuilderFactory,
  AliasedRawBuilderFactory,
  AnyAliasedColumn,
  AnyAliasedColumnWithTable,
  AnyAliasedQueryBuilder,
  AnyAliasedRawBuilder,
  AnyColumn,
  AnyColumnWithTable,
  InsertResultTypeTag,
  RowType,
  ValueType,
} from '../util/type-utils.js'
import { parseAliasedStringReference } from './reference-parser.js'
import { DynamicReferenceBuilder } from '../dynamic/dynamic-reference-builder.js'
import { ParseContext } from './parse-context.js'

/**
 * A selection expression.
 */
export type SelectExpression<DB, TB extends keyof DB> =
  | AnyAliasedColumnWithTable<DB, TB>
  | AnyAliasedColumn<DB, TB>
  | AnyColumnWithTable<DB, TB>
  | AnyColumn<DB, TB>
  | AnyAliasedRawBuilder
  | AliasedRawBuilderFactory<DB, TB>
  | AnyAliasedQueryBuilder
  | AliasedQueryBuilderFactory<DB, TB>
  | DynamicReferenceBuilder<any>

export type SelectExpressionOrList<DB, TB extends keyof DB> =
  | SelectExpression<DB, TB>
  | ReadonlyArray<SelectExpression<DB, TB>>

/**
 * Given a selection expression returns a query builder type that
 * has the selection.
 */
export type QueryBuilderWithSelection<
  DB,
  TB extends keyof DB,
  O,
  S
> = QueryBuilder<
  DB,
  TB,
  O extends InsertResultTypeTag ? InsertResultTypeTag : O & Selection<DB, TB, S>
>

/**
 * `selectAll` output query builder type.
 */
export type SelectAllQueryBuilder<
  DB,
  TB extends keyof DB,
  O,
  S extends keyof DB
> = QueryBuilder<DB, TB, O & RowType<DB, S>>

export type Selection<DB, TB extends keyof DB, S> = {
  [A in ExtractAliasFromSelectExpression<S>]: ExtractTypeFromSelectExpression<
    DB,
    TB,
    S,
    A
  >
}

type ExtractAliasFromSelectExpression<S> = S extends string
  ? ExtractAliasFromStringSelectExpression<S>
  : S extends AliasedRawBuilder<any, infer RA>
  ? RA
  : S extends (qb: any) => AliasedRawBuilder<any, infer RA>
  ? RA
  : S extends AliasedQueryBuilder<any, any, any, infer QA>
  ? QA
  : S extends (qb: any) => AliasedQueryBuilder<any, any, any, infer QA>
  ? QA
  : S extends DynamicReferenceBuilder<infer RA>
  ? ExtractAliasFromStringSelectExpression<RA>
  : never

type ExtractAliasFromStringSelectExpression<S extends string> =
  S extends `${string}.${string}.${string} as ${infer A}`
    ? A
    : S extends `${string}.${string} as ${infer A}`
    ? A
    : S extends `${string} as ${infer A}`
    ? A
    : S extends `${string}.${string}.${infer C}`
    ? C
    : S extends `${string}.${infer C}`
    ? C
    : S

type ExtractTypeFromSelectExpression<
  DB,
  TB extends keyof DB,
  S,
  A extends keyof any
> = S extends string
  ? ExtractTypeFromStringSelectExpression<DB, TB, S, A>
  : S extends AliasedRawBuilder<infer O, infer RA>
  ? RA extends A
    ? O
    : never
  : S extends (qb: any) => AliasedRawBuilder<infer O, infer RA>
  ? RA extends A
    ? O
    : never
  : S extends AliasedQueryBuilder<any, any, infer O, infer QA>
  ? QA extends A
    ? ValueType<O>
    : never
  : S extends (qb: any) => AliasedQueryBuilder<any, any, infer O, infer QA>
  ? QA extends A
    ? ValueType<O>
    : never
  : S extends DynamicReferenceBuilder<infer RA>
  ? A extends ExtractAliasFromStringSelectExpression<RA>
    ? ExtractTypeFromStringSelectExpression<DB, TB, RA, A> | undefined
    : never
  : never

type ExtractTypeFromStringSelectExpression<
  DB,
  TB extends keyof DB,
  S extends string,
  A extends keyof any,
  R = RowType<DB, TB>
> = S extends `${infer SC}.${infer T}.${infer C} as ${infer RA}`
  ? RA extends A
    ? `${SC}.${T}` extends TB
      ? C extends keyof DB[`${SC}.${T}`]
        ? DB[`${SC}.${T}`][C]
        : never
      : never
    : never
  : S extends `${infer T}.${infer C} as ${infer RA}`
  ? RA extends A
    ? T extends TB
      ? C extends keyof DB[T]
        ? DB[T][C]
        : never
      : never
    : never
  : S extends `${infer C} as ${infer RA}`
  ? RA extends A
    ? C extends keyof R
      ? R[C]
      : never
    : never
  : S extends `${infer SC}.${infer T}.${infer C}`
  ? C extends A
    ? `${SC}.${T}` extends TB
      ? C extends keyof DB[`${SC}.${T}`]
        ? DB[`${SC}.${T}`][C]
        : never
      : never
    : never
  : S extends `${infer T}.${infer C}`
  ? C extends A
    ? T extends TB
      ? C extends keyof DB[T]
        ? DB[T][C]
        : never
      : never
    : never
  : S extends A
  ? S extends keyof R
    ? R[S]
    : never
  : never

export function parseSelectExpressionOrList(
  ctx: ParseContext,
  selection: SelectExpressionOrList<any, any>
): SelectionNode[] {
  if (isReadonlyArray(selection)) {
    return selection.map((it) => parseSelectExpression(ctx, it))
  } else {
    return [parseSelectExpression(ctx, selection)]
  }
}

function parseSelectExpression(
  ctx: ParseContext,
  selection: SelectExpression<any, any>
): SelectionNode {
  if (isString(selection)) {
    return SelectionNode.create(parseAliasedStringReference(selection))
  } else if (isOperationNodeSource(selection)) {
    return SelectionNode.create(selection.toOperationNode())
  } else if (isFunction(selection)) {
    return SelectionNode.create(
      selection(ctx.createExpressionBuilder()).toOperationNode()
    )
  } else {
    throw new Error(
      `invalid value passed to select method: ${JSON.stringify(selection)}`
    )
  }
}

export function parseSelectAll(table?: string | string[]): SelectionNode[] {
  if (!table) {
    return [SelectionNode.createSelectAll()]
  } else if (Array.isArray(table)) {
    return table.map(parseSelectAllArg)
  } else {
    return [parseSelectAllArg(table)]
  }
}

function parseSelectAllArg(table: string): SelectionNode {
  if (isString(table)) {
    return SelectionNode.createSelectAllFromTable(table)
  } else {
    throw new Error(
      `invalid value passed to selectAll method: ${JSON.stringify(table)}`
    )
  }
}
