import type { SelectQueryBuilder } from '../query-builder/select-query-builder.js'
import type {
  ExtractTableAlias,
  From,
  FromAliasedTable,
  FromTables,
  TableExpressionOrList,
} from './table-parser.js'

export type SelectFrom<
  DB,
  TB extends keyof DB,
  TE extends TableExpressionOrList<DB, TB>,
> = [TE] extends [keyof DB]
  ? // This branch creates a good-looking type for the most common case:
    // selectFrom('person') --> SelectQueryBuilder<DB, 'person', {}>.
    // ExtractTableAlias is needed for the case where DB == any. Without it:
    // selectFrom('person as p') --> SelectQueryBuilder<DB, 'person as p', {}>
    SelectQueryBuilder<DB, TB | ExtractTableAlias<DB, TE>, {}>
  : // This branch creates a good-looking type for common aliased case:
    // selectFrom('person as p') --> SelectQueryBuilder<FromAliasedTable<DB, Person, 'p'>, 'p', {}>.
    [TE] extends [`${infer T} as ${infer A}`]
    ? T extends keyof DB
      ? SelectQueryBuilder<FromAliasedTable<DB, DB[T], A>, TB | A, {}>
      : never
    : TE extends ReadonlyArray<infer T>
      ? SelectQueryBuilder<From<DB, T>, FromTables<DB, TB, T>, {}>
      : SelectQueryBuilder<From<DB, TE>, FromTables<DB, TB, TE>, {}>
