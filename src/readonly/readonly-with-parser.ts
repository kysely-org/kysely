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
import type { SelectQueryBuilder } from '../query-builder/select-query-builder.js'
import type { ReadonlyQueryCreator } from './readonly-query-creator.js'

/**
 * Similar to {@link CommonTableExpression} but read-only.
 */
export type ReadonlyCommonTableExpression<DB, CN> =
  | ReadonlyCommonTableExpressionOutput<DB, CN>
  | ReadonlyCommonTableExpressionFactory<DB, CN>

/**
 * Similar to {@link CommonTableExpressionFactory} but read-only.
 */
export type ReadonlyCommonTableExpressionFactory<DB, CN> = (
  creator: ReadonlyQueryCreator<DB>,
) => ReadonlyCommonTableExpressionOutput<DB, CN>

/**
 * Similar to {@link RecursiveCommonTableExpression} but read-only.
 */
export type ReadonlyRecursiveCommonTableExpression<DB, CN extends string> = (
  creator: ReadonlyQueryCreator<
    // Recursive CTE can select from itself.
    DB & {
      [K in ExtractTableFromCommonTableExpressionName<CN>]: ExtractRowFromCommonTableExpressionName<CN>
    }
  >,
) => ReadonlyCommonTableExpressionOutput<DB, CN>

/**
 * Similar to {@link CommonTableExpressionOutput} but read-only.
 */
export type ReadonlyCommonTableExpressionOutput<DB, CN> =
  | SelectQueryBuilder<DB, any, any>
  | Expression<ExtractRowFromCommonTableExpressionName<CN>>

/**
 * Similar to {@link QueryCreatorWithCommonTableExpression} but read-only.
 */
export type ReadonlyQueryCreatorWithCommonTableExpression<
  DB,
  CN extends string,
  CTE,
> = ReadonlyQueryCreator<
  DB & {
    [K in ExtractTableFromCommonTableExpressionName<CN>]: ReadonlyExtractRowFromCommonTableExpression<CTE>
  }
>

/**
 * Similar to {@link ExtractRowFromCommonTableExpression} but read-only.
 */
export type ReadonlyExtractRowFromCommonTableExpression<CTE> =
  CTE extends Expression<infer O>
    ? O
    : CTE extends (creator: ReadonlyQueryCreator<any>) => infer Q
      ? Q extends Expression<infer O>
        ? O
        : never
      : never
