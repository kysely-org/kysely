import type { AliasedDynamicTableBuilder } from '../dynamic/dynamic-table-builder.js'
import type { SelectQueryBuilder } from '../query-builder/select-query-builder.js'
import { KyselyTypeError } from '../util/type-error.js'
import type { ShallowRecord } from '../util/type-utils.js'
import type {
  ExtractTableAlias,
  From,
  FromTables,
  TableExpressionOrList,
} from './table-parser.js'

export type SelectFrom<
  DB,
  TB extends keyof DB,
  TE extends TableExpressionOrList<DB, TB>,
> = TE extends keyof DB & string
  ? // This branch creates a good-looking type for the most common case:
    // selectFrom('person') --> SelectQueryBuilder<DB, 'person', {}>.
    // ExtractTableAlias is needed for the case where DB == any. Without it:
    // selectFrom('person as p') --> SelectQueryBuilder<DB, 'person as p', {}>
    SelectQueryBuilder<DB, TB | ExtractTableAlias<DB, TE>, {}>
  : // This branch creates a good-looking type for common aliased case:
    // selectFrom('person as p') --> SelectQueryBuilder<DB & { p: Person }, 'p', {}>.
    TE extends `${infer T} as ${infer A}`
    ? T extends keyof DB
      ? SelectQueryBuilder<DB & ShallowRecord<A, DB[T]>, TB | A, {}>
      : never
    : // This branch parses dynamic table builders where `T` can be a union of many
      // tables. We handle this by adding a union of all the tables in `T` to the
      // `DB` type.
      TE extends AliasedDynamicTableBuilder<infer T, infer A>
      ? SelectQueryBuilder<
          DB & ShallowRecord<A, T extends keyof DB ? DB[T] : never>,
          TB | A,
          {}
        >
      : TE extends ReadonlyArray<infer T>
        ? SelectQueryBuilder<From<DB, T>, FromTables<DB, TB, T>, {}>
        : SelectQueryBuilder<From<DB, TE>, FromTables<DB, TB, TE>, {}>
