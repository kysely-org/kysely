import { DeleteResult } from '../query-builder/delete-result.js'
import { InsertResult } from '../query-builder/insert-result.js'
import { QueryBuilder } from '../query-builder/query-builder.js'
import { UpdateResult } from '../query-builder/update-result.js'
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
  O extends InsertResult
    ? Selection<DB, TB, S>
    : O extends DeleteResult
    ? Selection<DB, TB, S>
    : O extends UpdateResult
    ? Selection<DB, TB, S>
    : O & Selection<DB, TB, S>
>
