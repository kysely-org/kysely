import { AliasedRawBuilder } from '../raw-builder/raw-builder.js'
import { isReadonlyArray, isString } from '../util/object-utils.js'
import {
  AliasedQueryBuilder,
  SelectQueryBuilder,
} from '../query-builder/select-query-builder.js'
import { SelectionNode } from '../operation-node/selection-node.js'
import {
  AnyAliasedColumn,
  AnyAliasedColumnWithTable,
  AnyColumn,
  AnyColumnWithTable,
  RowType,
  ValueType,
} from '../util/type-utils.js'
import { parseAliasedStringReference } from './reference-parser.js'
import {
  DynamicReferenceBuilder,
  isDynamicReferenceBuilder,
} from '../dynamic/dynamic-reference-builder.js'
import { ParseContext } from './parse-context.js'
import {
  AliasedComplexExpression,
  parseAliasedComplexExpression,
} from './complex-expression-parser.js'

export type SelectExpression<DB, TB extends keyof DB> =
  | AnyAliasedColumnWithTable<DB, TB>
  | AnyAliasedColumn<DB, TB>
  | AnyColumnWithTable<DB, TB>
  | AnyColumn<DB, TB>
  | DynamicReferenceBuilder<any>
  | AliasedComplexExpression<DB, TB>

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
  SE
> = SelectQueryBuilder<DB, TB, O & Selection<DB, TB, SE>>

/**
 * `selectAll` output query builder type.
 */
export type SelectAllQueryBuilder<
  DB,
  TB extends keyof DB,
  O,
  S extends keyof DB
> = SelectQueryBuilder<DB, TB, O & RowType<DB, S>>

export type Selection<DB, TB extends keyof DB, SE> = {
  [A in ExtractAliasFromSelectExpression<SE>]: ExtractTypeFromSelectExpression<
    DB,
    TB,
    SE,
    A
  >
}

type ExtractAliasFromSelectExpression<SE> = SE extends string
  ? ExtractAliasFromStringSelectExpression<SE>
  : SE extends AliasedRawBuilder<any, infer RA>
  ? RA
  : SE extends (qb: any) => AliasedRawBuilder<any, infer RA>
  ? RA
  : SE extends AliasedQueryBuilder<any, any, any, infer QA>
  ? QA
  : SE extends (qb: any) => AliasedQueryBuilder<any, any, any, infer QA>
  ? QA
  : SE extends DynamicReferenceBuilder<infer RA>
  ? ExtractAliasFromStringSelectExpression<RA>
  : never

type ExtractAliasFromStringSelectExpression<SE extends string> =
  SE extends `${string}.${string}.${string} as ${infer A}`
    ? A
    : SE extends `${string}.${string} as ${infer A}`
    ? A
    : SE extends `${string} as ${infer A}`
    ? A
    : SE extends `${string}.${string}.${infer C}`
    ? C
    : SE extends `${string}.${infer C}`
    ? C
    : SE

type ExtractTypeFromSelectExpression<
  DB,
  TB extends keyof DB,
  SE,
  A extends keyof any
> = SE extends string
  ? ExtractTypeFromStringSelectExpression<DB, TB, SE, A>
  : SE extends AliasedRawBuilder<infer O, infer RA>
  ? RA extends A
    ? O
    : never
  : SE extends (qb: any) => AliasedRawBuilder<infer O, infer RA>
  ? RA extends A
    ? O
    : never
  : SE extends AliasedQueryBuilder<any, any, infer O, infer QA>
  ? QA extends A
    ? ValueType<O>
    : never
  : SE extends (qb: any) => AliasedQueryBuilder<any, any, infer O, infer QA>
  ? QA extends A
    ? ValueType<O>
    : never
  : SE extends DynamicReferenceBuilder<infer RA>
  ? A extends ExtractAliasFromStringSelectExpression<RA>
    ? ExtractTypeFromStringSelectExpression<DB, TB, RA, A> | undefined
    : never
  : never

type ExtractTypeFromStringSelectExpression<
  DB,
  TB extends keyof DB,
  SE extends string,
  A extends keyof any,
  R = RowType<DB, TB>
> = SE extends `${infer SC}.${infer T}.${infer C} as ${infer RA}`
  ? RA extends A
    ? `${SC}.${T}` extends TB
      ? C extends keyof DB[`${SC}.${T}`]
        ? DB[`${SC}.${T}`][C]
        : never
      : never
    : never
  : SE extends `${infer T}.${infer C} as ${infer RA}`
  ? RA extends A
    ? T extends TB
      ? C extends keyof DB[T]
        ? DB[T][C]
        : never
      : never
    : never
  : SE extends `${infer C} as ${infer RA}`
  ? RA extends A
    ? C extends keyof R
      ? R[C]
      : never
    : never
  : SE extends `${infer SC}.${infer T}.${infer C}`
  ? C extends A
    ? `${SC}.${T}` extends TB
      ? C extends keyof DB[`${SC}.${T}`]
        ? DB[`${SC}.${T}`][C]
        : never
      : never
    : never
  : SE extends `${infer T}.${infer C}`
  ? C extends A
    ? T extends TB
      ? C extends keyof DB[T]
        ? DB[T][C]
        : never
      : never
    : never
  : SE extends A
  ? SE extends keyof R
    ? R[SE]
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
  } else if (isDynamicReferenceBuilder(selection)) {
    return SelectionNode.create(selection.toOperationNode())
  } else {
    return SelectionNode.create(parseAliasedComplexExpression(ctx, selection))
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
  }

  throw new Error(
    `invalid value selectAll expression: ${JSON.stringify(table)}`
  )
}
