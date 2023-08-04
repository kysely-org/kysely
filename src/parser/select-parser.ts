import { isFunction, isReadonlyArray, isString } from '../util/object-utils.js'
import { AliasedSelectQueryBuilder } from '../query-builder/select-query-builder.js'
import { SelectionNode } from '../operation-node/selection-node.js'
import {
  AnyAliasedColumn,
  AnyAliasedColumnWithTable,
  AnyColumn,
  AnyColumnWithTable,
  DrainOuterGeneric,
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
import { SelectType } from '../util/column-type.js'
import { parseTable } from './table-parser.js'
import { AliasedExpression } from '../expression/expression.js'
import {
  expressionBuilder,
  ExpressionBuilder,
} from '../expression/expression-builder.js'
import { Database } from '../database.js'

export type SelectExpression<
  DB extends Database,
  TB extends keyof DB['tables']
> =
  | AnyAliasedColumnWithTable<DB, TB>
  | AnyAliasedColumn<DB, TB>
  | AnyColumnWithTable<DB, TB>
  | AnyColumn<DB, TB>
  | DynamicReferenceBuilder<any>
  | AliasedExpressionOrFactory<DB, TB>

export type SelectCallback<
  DB extends Database,
  TB extends keyof DB['tables']
> = (eb: ExpressionBuilder<DB, TB>) => ReadonlyArray<SelectExpression<DB, TB>>

/**
 * Turns a SelectExpression or a union of them into a selection object.
 */
export type Selection<
  DB extends Database,
  TB extends keyof DB['tables'],
  SE
  // Inline version of DrainOuterGeneric for performance reasons.
  // Don't replace with DrainOuterGeneric!
> = [DB] extends [Database]
  ? {
      [E in FlattenSelectExpression<SE> as ExtractAliasFromSelectExpression<E>]: SelectType<
        ExtractTypeFromSelectExpression<DB, TB, E>
      >
    }
  : {}

/**
 * Turns a SelectCallback into a selection object.
 */
export type CallbackSelection<
  DB extends Database,
  TB extends keyof DB['tables'],
  CB
> = CB extends (eb: any) => ReadonlyArray<infer SE>
  ? Selection<DB, TB, SE>
  : never

export type SelectArg<
  DB extends Database,
  TB extends keyof DB['tables'],
  SE extends SelectExpression<DB, TB>
> =
  | SE
  | ReadonlyArray<SE>
  | ((eb: ExpressionBuilder<DB, TB>) => ReadonlyArray<SE>)

type FlattenSelectExpression<SE> = SE extends DynamicReferenceBuilder<infer RA>
  ? { [R in RA]: DynamicReferenceBuilder<R> }[RA]
  : SE

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
  DB extends Database,
  TB extends keyof DB['tables'],
  SE
> = SE extends string
  ? ExtractTypeFromStringSelectExpression<DB, TB, SE>
  : SE extends AliasedSelectQueryBuilder<infer O, any>
  ? O[keyof O] | null
  : SE extends (eb: any) => AliasedSelectQueryBuilder<infer O, any>
  ? O[keyof O] | null
  : SE extends AliasedExpression<infer O, any>
  ? O
  : SE extends (eb: any) => AliasedExpression<infer O, any>
  ? O
  : SE extends DynamicReferenceBuilder<infer RA>
  ? ExtractTypeFromStringSelectExpression<DB, TB, RA> | undefined
  : never

type ExtractTypeFromStringSelectExpression<
  DB extends Database,
  TB extends keyof DB['tables'],
  SE extends string
> = SE extends `${infer SC}.${infer T}.${infer C} as ${string}`
  ? `${SC}.${T}` extends TB
    ? C extends keyof DB['tables'][`${SC}.${T}`]
      ? DB['tables'][`${SC}.${T}`][C]
      : never
    : never
  : SE extends `${infer T}.${infer C} as ${string}`
  ? T extends TB
    ? C extends keyof DB['tables'][T]
      ? DB['tables'][T][C]
      : never
    : never
  : SE extends `${infer C} as ${string}`
  ? C extends AnyColumn<DB, TB>
    ? ExtractColumnType<DB, TB, C>
    : never
  : SE extends `${infer SC}.${infer T}.${infer C}`
  ? `${SC}.${T}` extends TB
    ? C extends keyof DB['tables'][`${SC}.${T}`]
      ? DB['tables'][`${SC}.${T}`][C]
      : never
    : never
  : SE extends `${infer T}.${infer C}`
  ? T extends TB
    ? C extends keyof DB['tables'][T]
      ? DB['tables'][T][C]
      : never
    : never
  : SE extends AnyColumn<DB, TB>
  ? ExtractColumnType<DB, TB, SE>
  : never

export type AllSelection<
  DB extends Database,
  TB extends keyof DB['tables']
> = DrainOuterGeneric<{
  [C in AnyColumn<DB, TB>]: {
    [T in TB]: SelectType<
      C extends keyof DB['tables'][T] ? DB['tables'][T][C] : never
    >
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
