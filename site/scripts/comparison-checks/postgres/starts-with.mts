// Kysely's `like` operator has no `escape` clause, so the escaped match is a
// typed raw expression wrapped in a reusable helper. It lives in its own
// module so that `sql` is Kysely's here and Postgres.js's in the scenarios, as
// on the page.
// DOC:starts-with
import { Expression, sql } from 'kysely'

function like(column: Expression<string>, pattern: string, escape = '\\') {
  return sql<boolean>`${column} like ${pattern} escape ${escape}`
}
// END:starts-with

export { like }

export function escapeLike(input: string) {
  return input.replace(/[\\%_]/g, '\\$&')
}
