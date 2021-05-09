import { isOperationNodeSource } from '../../operation-node/operation-node-source'
import { AliasedRawBuilder } from '../../raw-builder/raw-builder'
import { isFunction, isString } from '../../utils/object-utils'
import {
  AliasedQueryBuilder,
  createEmptySelectQuery,
  QueryBuilder,
} from '../query-builder'
import {
  createSelectAllSelectionNode,
  createSelectAllSelectionNodeWithTable,
  createSelectionNode,
  SelectionNode,
} from '../../operation-node/selection-node'
import {
  AliasedQueryBuilderFactory,
  AliasedRawBuilderFactory,
  AnyAliasedColumnWithTable,
  AnyAliasedQueryBuilder,
  AnyColumn,
  AnyColumnWithTable,
  RowType,
  ValueType,
} from '../type-utils'
import { InsertResultTypeTag } from './insert-values-parser'
import { parseAliasedStringReference } from './reference-parser'
import { DynamicReferenceBuilder } from '../../dynamic/dynamic-reference-builder'

/**
 * A selection exrpession.
 */
export type SelectExpression<DB, TB extends keyof DB, O> =
  | AnyAliasedColumnWithTable<DB, TB>
  | AnyColumnWithTable<DB, TB>
  | AnyColumn<DB, TB>
  | AliasedRawBuilder<any, any>
  | AliasedRawBuilderFactory<DB, TB, O>
  | AnyAliasedQueryBuilder
  | AliasedQueryBuilderFactory<DB, TB, O>
  | DynamicReferenceBuilder<any>

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
  O extends InsertResultTypeTag
    ? InsertResultTypeTag
    : O & SelectResultType<DB, TB, S>
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

export type SelectResultType<DB, TB extends keyof DB, S> = {
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

type ExtractAliasFromStringSelectExpression<
  S extends string
> = S extends `${string}.${string}.${string} as ${infer A}`
  ? A
  : S extends `${string}.${string}.${infer C}`
  ? C
  : S extends `${string}.${string} as ${infer A}`
  ? A
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
  : S extends `${infer SC}.${infer T}.${infer C}`
  ? C extends A
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

export function parseSelectArgs(
  selection: SelectExpression<any, any, any> | SelectExpression<any, any, any>[]
): SelectionNode[] {
  if (Array.isArray(selection)) {
    return selection.map((it) => parseSelectArg(it))
  } else {
    return [parseSelectArg(selection)]
  }
}

function parseSelectArg(
  selection: SelectExpression<any, any, any>
): SelectionNode {
  if (isString(selection)) {
    return createSelectionNode(parseAliasedStringReference(selection))
  } else if (isOperationNodeSource(selection)) {
    return createSelectionNode(selection.toOperationNode())
  } else if (isFunction(selection)) {
    return createSelectionNode(
      selection(createEmptySelectQuery()).toOperationNode()
    )
  } else {
    throw new Error(
      `invalid value passed to select method: ${JSON.stringify(selection)}`
    )
  }
}

export function parseSelectAllArgs(table?: string | string[]): SelectionNode[] {
  if (!table) {
    return [createSelectAllSelectionNode()]
  } else if (Array.isArray(table)) {
    return table.map(parseSelectAllArg)
  } else {
    return [parseSelectAllArg(table)]
  }
}

export function parseSelectAllArg(table: string): SelectionNode {
  if (isString(table)) {
    return createSelectAllSelectionNodeWithTable(table)
  } else {
    throw new Error(
      `invalid value passed to selectAll method: ${JSON.stringify(table)}`
    )
  }
}
