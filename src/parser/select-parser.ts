import { isFunction, isReadonlyArray, isString } from '../util/object-utils.js'
import { AliasedSelectQueryBuilder } from '../query-builder/select-query-builder.js'
import { SelectionNode } from '../operation-node/selection-node.js'
import {
  AnyAliasedColumn,
  AnyAliasedColumnWithTable,
  AnyColumn,
  AnyColumnWithTable,
  ExtractColumnType,
} from '../util/type-utils.js'
import { parseAliasedStringReference } from './reference-parser.js'
import {
  DynamicReferenceBuilder,
  isDynamicReferenceBuilder,
} from '../dynamic/dynamic-reference-builder.js'
import {
  AliasedExpressionOrFactory,
  parseAliasedExpression,
} from './expression-parser.js'
import { Selectable, SelectType } from '../util/column-type.js'
import { parseTable } from './table-parser.js'
import { AliasedExpression } from '../expression/expression.js'
import {
  expressionBuilder,
  ExpressionBuilder,
} from '../expression/expression-builder.js'

export type SelectExpression<DB, TB extends keyof DB> =
  | AnyAliasedColumnWithTable<DB, TB>
  | AnyAliasedColumn<DB, TB>
  | AnyColumnWithTable<DB, TB>
  | AnyColumn<DB, TB>
  | DynamicReferenceBuilder<any>
  | AliasedExpressionOrFactory<DB, TB>

export type SelectArg<
  DB,
  TB extends keyof DB,
  SE extends SelectExpression<DB, TB>
> =
  | SE
  | ReadonlyArray<SE>
  | ((eb: ExpressionBuilder<DB, TB>) => ReadonlyArray<SE>)

export type Selection<DB, TB extends keyof DB, SE> = {
  [A in ExtractAliasFromSelectExpression<SE>]: SelectType<
    ExtractTypeFromSelectExpression<DB, TB, SE, A>
  >
}

type ExtractAliasFromSelectExpression<SE> = SE extends string
  ? ExtractAliasFromStringSelectExpression<SE>
  : SE extends AliasedExpression<any, infer EA>
  ? EA
  : SE extends (qb: any) => AliasedExpression<any, infer EA>
  ? EA
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
  : SE extends AliasedSelectQueryBuilder<any, any, infer O, infer QA>
  ? QA extends A
    ? O[keyof O] | null
    : never
  : SE extends (
      qb: any
    ) => AliasedSelectQueryBuilder<any, any, infer O, infer QA>
  ? QA extends A
    ? O[keyof O] | null
    : never
  : SE extends AliasedExpression<infer O, infer EA>
  ? EA extends A
    ? O
    : never
  : SE extends (qb: any) => AliasedExpression<infer O, infer EA>
  ? EA extends A
    ? O
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
  A extends keyof any
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
    ? C extends AnyColumn<DB, TB>
      ? ExtractColumnType<DB, TB, C>
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
  ? SE extends AnyColumn<DB, TB>
    ? ExtractColumnType<DB, TB, SE>
    : never
  : never

export type AllSelection<DB, TB extends keyof DB> = Selectable<{
  [C in AnyColumn<DB, TB>]: {
    [T in TB]: C extends keyof DB[T] ? DB[T][C] : never
  }[TB]
}>

export function parseSelectArg(
  selection: SelectArg<any, any, SelectExpression<any, any>>
): SelectionNode[] {
  if (isFunction(selection)) {
    return parseSelectArg(selection(expressionBuilder()))
  } else if (isReadonlyArray(selection)) {
    return selection.map((it) => parseSelectExpression(it))
  } else {
    return [parseSelectExpression(selection)]
  }
}

function parseSelectExpression(
  selection: SelectExpression<any, any>
): SelectionNode {
  if (isString(selection)) {
    return SelectionNode.create(parseAliasedStringReference(selection))
  } else if (isDynamicReferenceBuilder(selection)) {
    return SelectionNode.create(selection.toOperationNode())
  } else {
    return SelectionNode.create(parseAliasedExpression(selection))
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
    return SelectionNode.createSelectAllFromTable(parseTable(table))
  }

  throw new Error(
    `invalid value selectAll expression: ${JSON.stringify(table)}`
  )
}
