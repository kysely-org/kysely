import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { Kysely, PGliteDialect, type InferResult } from 'kysely'
import { sql } from 'drizzle-stable'
import { integer, jsonb, pgTable, QueryBuilder } from 'drizzle-stable/pg-core'
import { sql as rcSql } from 'drizzle-rc'
import {
  integer as rcInteger,
  jsonb as rcJsonb,
  pgTable as rcTable,
  QueryBuilder as RcBuilder,
} from 'drizzle-rc/pg-core'
type Profile = { addresses: { city: string }[] }
interface Database {
  user_settings: { id: number; profile: Profile }
}
const pglite = new PGlite()
const db = new Kysely<Database>({ dialect: new PGliteDialect({ pglite }) })
const settings = pgTable('user_settings', {
  id: integer().notNull(),
  profile: jsonb().$type<Profile>().notNull(),
})
const rcSettings = rcTable('user_settings', {
  id: rcInteger().notNull(),
  profile: rcJsonb().$type<Profile>().notNull(),
})
const drizzleDb = new QueryBuilder()
const rcDb = new RcBuilder()
const kyselyQuery = db
  .selectFrom('user_settings')
  .select('id')
  .select((eb) =>
    eb.ref('profile', '->').key('addresses').at(0).key('city').as('first_city'),
  )
  .orderBy('id')
const drizzleQuery = drizzleDb
  .select({
    id: settings.id,
    first_city: sql<
      string | null
    >`${settings.profile}->'addresses'->0->'city'`.as('first_city'),
  })
  .from(settings)
  .orderBy(settings.id)
const rcQuery = rcDb
  .select({
    id: rcSettings.id,
    first_city: rcSql<
      string | null
    >`${rcSettings.profile}->'addresses'->0->'city'`.as('first_city'),
  })
  .from(rcSettings)
  .orderBy(rcSettings.id)
const typoQuery = drizzleDb
  .select({
    first_city: sql<
      string | null
    >`${settings.profile}->'addresses'->0->'ctiy'`.as('first_city'),
  })
  .from(settings)
const rcTypo = rcDb
  .select({
    first_city: rcSql<
      string | null
    >`${rcSettings.profile}->'addresses'->0->'ctiy'`.as('first_city'),
  })
  .from(rcSettings)
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false
type Expect<T extends true> = T
type ResultCheck = Expect<
  Equal<
    InferResult<typeof kyselyQuery>,
    { id: number; first_city: string | null }[]
  >
>
function compileChecks() {
  db.selectFrom('user_settings').select((eb) =>
    // @ts-expect-error ctiy is not a key of the address object.
    eb.ref('profile', '->').key('addresses').at(0).key('ctiy').as('first_city'),
  )
  db.selectFrom('user_settings').select((eb) =>
    // @ts-expect-error addresses is an array and must be indexed before selecting city.
    eb.ref('profile', '->').key('addresses').key('city').as('first_city'),
  )
}
void compileChecks
async function run(q: { toSQL(): { sql: string; params: any[] } }) {
  const c = q.toSQL()
  return (await pglite.query(c.sql, c.params)).rows
}
try {
  await pglite.exec(
    'create table user_settings(id integer,profile jsonb not null)',
  )
  for (const [id, profile] of [
    [1, { addresses: [{ city: 'Paris' }, { city: 'Rome' }] }],
    [2, { addresses: [] }],
    [3, { addresses: [{ city: 'Tokyo' }] }],
  ] as const)
    await pglite.query('insert into user_settings values($1,$2::jsonb)', [
      id,
      JSON.stringify(profile),
    ])
  const rows = await kyselyQuery.execute()
  assert.deepEqual(rows, [
    { id: 1, first_city: 'Paris' },
    { id: 2, first_city: null },
    { id: 3, first_city: 'Tokyo' },
  ])
  for (const q of [drizzleQuery, rcQuery]) assert.deepEqual(await run(q), rows)
  for (const q of [typoQuery, rcTypo])
    assert.deepEqual(await run(q), [
      { first_city: null },
      { first_city: null },
      { first_city: null },
    ])
  console.log(
    'PASS: matching JSON traversal results with null for empty arrays in Kysely and Drizzle stable/RC; Drizzle misspelled path silently returns null, Kysely rejects typo and invalid array traversal; exact nullable result inferred',
  )
} finally {
  await db.destroy()
}
