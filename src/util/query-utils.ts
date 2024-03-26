import { DeleteQueryBuilder } from '../query-builder/delete-query-builder.js'
import { InsertQueryBuilder } from '../query-builder/insert-query-builder.js'
import {
  MatchedThenableMergeQueryBuilder,
  MergeQueryBuilder,
  NotMatchedThenableMergeQueryBuilder,
  WheneableMergeQueryBuilder,
} from '../query-builder/merge-query-builder.js'
import { SelectQueryBuilder } from '../query-builder/select-query-builder.js'
import { UpdateQueryBuilder } from '../query-builder/update-query-builder.js'

type AnyMergeQueryBuilder<
  DB,
  TT extends keyof DB,
  ST extends keyof DB,
  UT extends TT | ST,
  O
> =
  | MergeQueryBuilder<DB, TT, O>
  | WheneableMergeQueryBuilder<DB, TT, ST, O>
  | MatchedThenableMergeQueryBuilder<DB, TT, ST, UT, O>
  | NotMatchedThenableMergeQueryBuilder<DB, TT, ST, O>

/**
 * A helper type that can accept any query builder object.
 *
 * You can use helper methods to determine the type of query builder object.
 *
 * See {@link isSelectQueryBuilder}, {@link isInsertQueryBuilder}, {@link isUpdateQueryBuilder},
 * {@link isDeleteQueryBuilder}, {@link isMergeQueryBuilder}.
 *
 * ### Example
 * ```ts
 * import { AnyQueryBuilder, isSelectQueryBuilder } from 'kysely'
 *
 * function alwaysSelectAll<DB, TB extends keyof DB, O>(qb: AnyQueryBuilder<DB, TB, O>) {
 *   // Here `qb` could be any query builder object.
 *   // We can use the helper method `isSelectQueryBuilder` to determine the type.
 *   if (isSelectQueryBuilder(qb)) {
 *     // We can now use `SelectQueryBuilder` methods and properties.
 *     return qb.clearSelect().selectAll()
 *   }
 *   return qb
 * }
 * ```
 */
export type AnyQueryBuilder<
  DB,
  TB extends keyof DB,
  O,
  UT extends keyof DB = any,
  ST extends keyof DB = any
> =
  | SelectQueryBuilder<DB, TB, O>
  | InsertQueryBuilder<DB, TB, O>
  | UpdateQueryBuilder<DB, UT, TB, O>
  | DeleteQueryBuilder<DB, TB, O>
  | AnyMergeQueryBuilder<DB, TB, ST, TB | ST, O>

/**
 * A helper method to determine if a query builder object is of type {@link SelectQueryBuilder}.
 *
 * Useful when using the {@link AnyQueryBuilder} type.
 */
export function isSelectQueryBuilder<DB, TB extends keyof DB, O>(
  qb: AnyQueryBuilder<DB, TB, O>
): qb is SelectQueryBuilder<DB, TB, O> {
  return !!(qb as SelectQueryBuilder<DB, TB, O>).isSelectQueryBuilder
}

/**
 * A helper method to determine if a query builder object is of type {@link InsertQueryBuilder}.
 *
 * Useful when using the {@link AnyQueryBuilder} type.
 */
export function isInsertQueryBuilder<DB, TB extends keyof DB, O>(
  qb: AnyQueryBuilder<DB, TB, O>
): qb is InsertQueryBuilder<DB, TB, O> {
  return !!(qb as InsertQueryBuilder<DB, TB, O>).isInsertQueryBuilder
}

/**
 * A helper method to determine if a query builder object is of type {@link UpdateQueryBuilder}.
 *
 * Useful when using the {@link AnyQueryBuilder} type.
 */
export function isUpdateQueryBuilder<
  DB,
  UT extends keyof DB,
  TB extends keyof DB,
  O
>(qb: AnyQueryBuilder<DB, TB, O, UT>): qb is UpdateQueryBuilder<DB, UT, TB, O> {
  return !!(qb as UpdateQueryBuilder<DB, UT, TB, O>).isUpdateQueryBuilder
}

/**
 * A helper method to determine if a query builder object is of type {@link DeleteQueryBuilder}.
 *
 * Useful when using the {@link AnyQueryBuilder} type.
 */
export function isDeleteQueryBuilder<DB, TB extends keyof DB, O>(
  qb: AnyQueryBuilder<DB, TB, O>
): qb is DeleteQueryBuilder<DB, TB, O> {
  return !!(qb as DeleteQueryBuilder<DB, TB, O>).isDeleteQueryBuilder
}

/**
 * A helper method to determine if a query builder object is of type {@link MergeQueryBuilder}.
 *
 * Useful when using the {@link AnyQueryBuilder} type.
 */
export function isMergeQueryBuilder<
  DB,
  TB extends keyof DB,
  O,
  ST extends keyof DB = any
>(
  qb: AnyQueryBuilder<DB, TB, O, ST>
): qb is typeof qb extends MergeQueryBuilder<DB, TB, O>
  ? MergeQueryBuilder<DB, TB, O>
  : typeof qb extends WheneableMergeQueryBuilder<DB, TB, ST, O>
  ? WheneableMergeQueryBuilder<DB, TB, ST, O>
  : typeof qb extends MatchedThenableMergeQueryBuilder<DB, TB, ST, TB | ST, O>
  ? MatchedThenableMergeQueryBuilder<DB, TB, ST, TB | ST, O>
  : typeof qb extends NotMatchedThenableMergeQueryBuilder<DB, TB, ST, O>
  ? NotMatchedThenableMergeQueryBuilder<DB, TB, ST, O>
  : never {
  return !!(qb as any).isMergeQueryBuilder
}
