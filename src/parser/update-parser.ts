import type { UpdateQueryBuilder } from '../query-builder/update-query-builder.js'
import type { UpdateResult } from '../query-builder/update-result.js'
import type {
  ExtractTableAlias,
  From,
  FromTables,
  ShadowTableWith,
  TableExpressionOrList,
} from './table-parser.js'

export type UpdateTable<DB, TE extends TableExpressionOrList<DB, never>> = [
  TE,
] extends [keyof DB]
  ? // ExtractTableAlias is needed for the case where DB == any. Without it:
    // updateTable('person as p') --> UpdateQueryBuilder<DB, 'person as p', 'person as p', {}>
    UpdateQueryBuilder<
      DB,
      ExtractTableAlias<DB, TE>,
      ExtractTableAlias<DB, TE>,
      UpdateResult
    >
  : [TE] extends [`${infer T} as ${infer A}`]
    ? T extends keyof DB
      ? UpdateQueryBuilder<ShadowTableWith<DB, A, DB[T]>, A, A, UpdateResult>
      : never
    : TE extends ReadonlyArray<infer T>
      ? UpdateQueryBuilder<
          From<DB, T>,
          FromTables<DB, never, T>,
          FromTables<DB, never, T>,
          UpdateResult
        >
      : UpdateQueryBuilder<
          From<DB, TE>,
          FromTables<DB, never, TE>,
          FromTables<DB, never, TE>,
          UpdateResult
        >
