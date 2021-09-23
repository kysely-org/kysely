import { QueryBuilder } from '../query-builder/query-builder.js'
import {
  DeleteResultTypeTag,
  InsertResultTypeTag,
  UpdateResultTypeTag,
} from '../query-builder/type-utils.js'
import { Selection } from './select-parser.js'

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
    ? Selection<DB, TB, S>
    : O extends DeleteResultTypeTag
    ? Selection<DB, TB, S>
    : O extends UpdateResultTypeTag
    ? Selection<DB, TB, S>
    : O & Selection<DB, TB, S>
>
