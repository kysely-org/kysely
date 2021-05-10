import { QueryBuilder } from '../query-builder/query-builder'
import { InsertResultTypeTag } from './insert-values-parser'
import { SelectResultType } from './select-parser'

/**
 * `returning` method output query builder type
 */
export type QueryBuilderWithReturning<
  DB,
  TB extends keyof DB,
  O,
  S
> = QueryBuilder<
  DB,
  TB,
  O extends InsertResultTypeTag
    ? SelectResultType<DB, TB, S>
    : O & SelectResultType<DB, TB, S>
>
