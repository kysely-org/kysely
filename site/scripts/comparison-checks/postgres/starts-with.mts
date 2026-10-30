// Kysely's `like` operator has no `escape` clause, so the escaped prefix
// match is a typed raw expression wrapped in a reusable helper. It lives in
// its own module so that `sql` is Kysely's here and Postgres.js's in the
// scenarios, as on the page.
// DOC:starts-with
import { Expression, sql } from 'kysely'

function startsWith(column: Expression<string>, prefix: string) {
  const pattern = prefix.replace(/[\\%_]/g, '\\$&') + '%'
  return sql<boolean>`${column} like ${pattern} escape '\\'`
}
// END:starts-with

export { startsWith }
