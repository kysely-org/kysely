import type { DeleteQueryBuilder } from '../query-builder/delete-query-builder.js'
import type { DeleteResult } from '../query-builder/delete-result.js'
import type { ShallowRecord } from '../util/type-utils.js'
import type {
  ExtractTableAlias,
  From,
  FromTables,
  TableExpressionOrList,
} from './table-parser.js'

export type DeleteFrom<DB, TE extends TableExpressionOrList<DB, never>> = [
  TE,
] extends [keyof DB]
  ? // This branch creates a good-looking type for the most common case:
    // deleteFrom('person') --> DeleteQueryBuilder<DB, 'person', {}>.
    // ExtractTableAlias is needed for the case where DB == any. Without it:
    // deleteFrom('person as p') --> DeleteQueryBuilder<DB, 'person as p', {}>
    DeleteQueryBuilder<DB, ExtractTableAlias<DB, TE>, DeleteResult>
  : // This branch creates a good-looking type for common aliased case:
    // deleteFrom('person as p') --> DeleteQueryBuilder<DB & { p: Person }, 'p', {}>.
    [TE] extends [`${infer T} as ${infer A}`]
    ? T extends keyof DB
      ? DeleteQueryBuilder<DB & ShallowRecord<A, DB[T]>, A, DeleteResult>
      : never
    : TE extends ReadonlyArray<infer T>
      ? DeleteQueryBuilder<From<DB, T>, FromTables<DB, never, T>, DeleteResult>
      : DeleteQueryBuilder<
          From<DB, TE>,
          FromTables<DB, never, TE>,
          DeleteResult
        >
