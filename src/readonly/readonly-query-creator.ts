import type { CTEBuilderCallback } from '../query-builder/cte-builder.js'
import type { QueryCreator } from '../query-creator.js'
import type { KyselyTypeError } from '../util/type-error.js'
import type {
  ReadonlyCommonTableExpression,
  ReadonlyQueryCreatorWithCommonTableExpression,
  ReadonlyRecursiveCommonTableExpression,
} from './readonly-with-parser.js'

/**
 * Similar to {@link QueryCreator} but read-only.
 */
export interface ReadonlyQueryCreator<DB> extends Pick<
  QueryCreator<DB>,
  'selectFrom' | 'selectNoFrom'
> {
  /**
   * @deprecated not allowed with a read-only Kysely instance.
   */
  deleteFrom(
    ...args: any[]
  ): KyselyTypeError<'not allowed with a read-only Kysely instance.'>

  /**
   * @deprecated not allowed with a read-only Kysely instance.
   */
  insertInto(
    ...args: any[]
  ): KyselyTypeError<'not allowed with a read-only Kysely instance.'>

  /**
   * @deprecated not allowed with a read-only Kysely instance.
   */
  mergeInto(
    ...args: any[]
  ): KyselyTypeError<'not allowed with a read-only Kysely instance.'>

  /**
   * @deprecated not allowed with a read-only Kysely instance.
   */
  replaceInto(
    ...args: any[]
  ): KyselyTypeError<'not allowed with a read-only Kysely instance.'>

  /**
   * @deprecated not allowed with a read-only Kysely instance.
   */
  updateTable(
    ...args: any[]
  ): KyselyTypeError<'not allowed with a read-only Kysely instance.'>

  /**
   * Similar to {@link QueryCreator.with} but read-only.
   */
  with<N extends string, E extends ReadonlyCommonTableExpression<DB, N>>(
    nameOrBuilder: N | CTEBuilderCallback<N>,
    expression: E,
  ): ReadonlyQueryCreatorWithCommonTableExpression<DB, N, E>

  /**
   * Similar to {@link QueryCreator.withRecursive} but read-only.
   */
  withRecursive<
    N extends string,
    E extends ReadonlyRecursiveCommonTableExpression<DB, N>,
  >(
    nameOrBuilder: N | CTEBuilderCallback<N>,
    expression: E,
  ): ReadonlyQueryCreatorWithCommonTableExpression<DB, N, E>
}
