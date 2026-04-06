import type { Expression } from '../expression/expression.js'
import type {
  CommonTableExpression,
  CommonTableExpressionFactory,
  CommonTableExpressionOutput,
  ExtractRowFromCommonTableExpression,
  ExtractRowFromCommonTableExpressionName,
  ExtractTableFromCommonTableExpressionName,
  QueryCreatorWithCommonTableExpression,
  RecursiveCommonTableExpression,
} from '../parser/with-parser.js'
import type { DrainOuterGeneric } from '../util/type-utils.js'
import type { ReadonlyQueryCreator } from './readonly-query-creator.js'

/**
 * Similar to {@link CommonTableExpression} but read-only.
 */
export type ReadonlyCommonTableExpression<DB, CN> =
  | ReadonlyCommonTableExpressionOutput<CN>
  | ReadonlyCommonTableExpressionFactory<DB, CN>

/**
 * Similar to {@link CommonTableExpressionFactory} but read-only.
 */
export type ReadonlyCommonTableExpressionFactory<DB, CN> = (
  creator: ReadonlyQueryCreator<DB>,
) => ReadonlyCommonTableExpressionOutput<CN>

/**
 * Similar to {@link RecursiveCommonTableExpression} but read-only.
 */
export type ReadonlyRecursiveCommonTableExpression<DB, CN extends string> = (
  creator: ReadonlyQueryCreator<
    // Recursive CTE can select from itself.
    DrainOuterGeneric<
      DB & {
        [K in ExtractTableFromCommonTableExpressionName<CN>]: ExtractRowFromCommonTableExpressionName<CN>
      }
    >
  >,
) => ReadonlyCommonTableExpressionOutput<CN>

/**
 * Similar to {@link CommonTableExpressionOutput} but read-only.
 */
export type ReadonlyCommonTableExpressionOutput<N> = Expression<
  ExtractRowFromCommonTableExpressionName<N>
>

/**
 * Similar to {@link QueryCreatorWithCommonTableExpression} but read-only.
 */
export type ReadonlyQueryCreatorWithCommonTableExpression<
  DB,
  CN extends string,
  CTE,
> = ReadonlyQueryCreator<
  DrainOuterGeneric<
    DB & {
      [K in ExtractTableFromCommonTableExpressionName<CN>]: ExtractRowFromCommonTableExpression<CTE>
    }
  >
>
