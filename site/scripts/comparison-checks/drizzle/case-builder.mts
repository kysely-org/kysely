import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { Kysely, PGliteDialect, type InferResult } from 'kysely'
import { sql, gte, lt } from 'drizzle-stable'
import { integer, pgTable, QueryBuilder } from 'drizzle-stable/pg-core'
import { sql as rcSql, gte as rcGte, lt as rcLt } from 'drizzle-rc'
import {
  integer as rcInteger,
  pgTable as rcTable,
  QueryBuilder as RcBuilder,
} from 'drizzle-rc/pg-core'
interface Database {
  person: { id: number; age: number | null }
}
const pglite = new PGlite()
const db = new Kysely<Database>({ dialect: new PGliteDialect({ pglite }) })
const person = pgTable('person', { id: integer().notNull(), age: integer() })
const rcPerson = rcTable('person', {
  id: rcInteger().notNull(),
  age: rcInteger(),
})
const drizzleDb = new QueryBuilder(),
  rcDb = new RcBuilder()
const k = db
  .selectFrom('person')
  .select('id')
  .select((eb) =>
    eb
      .case()
      .when('age', '>=', 18)
      .then('adult')
      .when('age', '<', 18)
      .then('minor')
      .else('unknown')
      .end()
      .as('age_group'),
  )
  .orderBy('id')
const kNoElse = db
  .selectFrom('person')
  .select('id')
  .select((eb) =>
    eb
      .case()
      .when('age', '>=', 18)
      .then('adult')
      .when('age', '<', 18)
      .then('minor')
      .end()
      .as('age_group'),
  )
  .orderBy('id')
const d = drizzleDb
  .select({
    id: person.id,
    age_group:
      sql<string>`case when ${gte(person.age, 18)} then ${'adult'} when ${lt(person.age, 18)} then ${'minor'} else ${'unknown'} end`.as(
        'age_group',
      ),
  })
  .from(person)
  .orderBy(person.id)
const dNoElse = drizzleDb
  .select({
    id: person.id,
    age_group:
      sql<string>`case when ${gte(person.age, 18)} then ${'adult'} when ${lt(person.age, 18)} then ${'minor'} end`.as(
        'age_group',
      ),
  })
  .from(person)
  .orderBy(person.id)
const r = rcDb
  .select({
    id: rcPerson.id,
    age_group:
      rcSql<string>`case when ${rcGte(rcPerson.age, 18)} then ${'adult'} when ${rcLt(rcPerson.age, 18)} then ${'minor'} else ${'unknown'} end`.as(
        'age_group',
      ),
  })
  .from(rcPerson)
  .orderBy(rcPerson.id)
const rNoElse = rcDb
  .select({
    id: rcPerson.id,
    age_group:
      rcSql<string>`case when ${rcGte(rcPerson.age, 18)} then ${'adult'} when ${rcLt(rcPerson.age, 18)} then ${'minor'} end`.as(
        'age_group',
      ),
  })
  .from(rcPerson)
  .orderBy(rcPerson.id)
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false
type Expect<T extends true> = T
type Complete = Expect<
  Equal<InferResult<typeof k>, { id: number; age_group: string }[]>
>
type Nullable = Expect<
  Equal<InferResult<typeof kNoElse>, { id: number; age_group: string | null }[]>
>
type DrizzleStale = Expect<
  Equal<typeof dNoElse._.result, { id: number; age_group: string }[]>
>
type RcStale = Expect<
  Equal<typeof rNoElse._.result, { id: number; age_group: string }[]>
>
function compileChecks(row: InferResult<typeof kNoElse>[number]) {
  // @ts-expect-error Omitting ELSE makes the label nullable.
  row.age_group.toUpperCase()
  db.selectFrom('person').select((eb) =>
    // @ts-expect-error An integer age cannot be compared with this string.
    eb.case().when('age', '>=', 'eighteen').then('adult').end().as('label'),
  )
  db.selectFrom('person').select((eb) =>
    // @ts-expect-error WHEN must be followed by THEN before END.
    eb.case().when('age', '>=', 18).end().as('label'),
  )
}
void compileChecks
async function run(q: { toSQL(): { sql: string; params: any[] } }) {
  const c = q.toSQL()
  return (await pglite.query(c.sql, c.params)).rows
}
try {
  await pglite.exec(
    'create table person(id integer,age integer);insert into person values(1,20),(2,12),(3,null)',
  )
  const complete = [
    { id: 1, age_group: 'adult' },
    { id: 2, age_group: 'minor' },
    { id: 3, age_group: 'unknown' },
  ]
  const nullable = [
    { id: 1, age_group: 'adult' },
    { id: 2, age_group: 'minor' },
    { id: 3, age_group: null },
  ]
  assert.deepEqual(await k.execute(), complete)
  for (const q of [d, r]) assert.deepEqual(await run(q), complete)
  assert.deepEqual(await kNoElse.execute(), nullable)
  for (const q of [dNoElse, rNoElse]) assert.deepEqual(await run(q), nullable)
  console.log(
    'PASS: matching CASE results with adult/minor/null-age fixtures; removing ELSE infers null in Kysely while both Drizzle versions retain stale string annotation; invalid predicate and incomplete branch rejected by Kysely',
  )
} finally {
  await db.destroy()
}
