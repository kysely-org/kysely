import type { UpdateQueryBuilder } from '../query-builder/update-query-builder.js'
import type { UpdateResult } from '../query-builder/update-result.js'
import type { ShallowRecord } from '../util/type-utils.js'
import type { ExtractTableAlias, From, FromTables } from './table-parser.js'

export type UpdateTable<
  DB,
  // Intentionally unconstrained. Constraining this to `TableExpression`
  // rejects the template-literal overload tiers that keep call sites off that
  // union, and every branch below already validates `TE` on its own.
  TE,
> = [TE] extends [keyof DB]
  ? // This branch creates a good-looking type for the most common case:
    // updateTable('person') --> UpdateQueryBuilder<DB, 'person', 'person', {}>.
    // ExtractTableAlias is needed for the case where DB == any. Without it:
    // updateTable('person as p') --> UpdateQueryBuilder<DB, 'person as p', 'person as p', {}>
    UpdateQueryBuilder<
      DB,
      ExtractTableAlias<DB, TE>,
      ExtractTableAlias<DB, TE>,
      UpdateResult
    >
  : // This branch creates a good-looking type for common aliased case:
    // updateTable('person as p') --> UpdateQueryBuilder<DB & { p: Person }, 'p', 'p', {}>.
    [TE] extends [`${infer T} as ${infer A}`]
    ? T extends keyof DB
      ? UpdateQueryBuilder<DB & ShallowRecord<A, DB[T]>, A, A, UpdateResult>
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
