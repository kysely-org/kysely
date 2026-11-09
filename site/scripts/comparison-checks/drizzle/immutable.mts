import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { Kysely, PGliteDialect } from 'kysely'
import { drizzle } from 'drizzle-stable/pglite'
import { integer, pgTable } from 'drizzle-stable/pg-core'
import { gte } from 'drizzle-stable'
import { drizzle as rcDrizzle } from 'drizzle-rc/pglite'
import { integer as rcInteger, pgTable as rcTable } from 'drizzle-rc/pg-core'
import { gte as rcGte } from 'drizzle-rc'
const pglite = new PGlite()
const db = new Kysely<{ person: { id: number; age: number | null } }>({
  dialect: new PGliteDialect({ pglite }),
})
const person = pgTable('person', { id: integer().notNull(), age: integer() })
const rcPerson = rcTable('person', {
  id: rcInteger().notNull(),
  age: rcInteger(),
})
const drizzleDb = drizzle(pglite),
  rcDb = rcDrizzle({ client: pglite })
try {
  await pglite.exec(
    'create table person(id integer,age integer);insert into person values(1,20),(2,30),(3,40),(4,12)',
  )
  const base = db
    .selectFrom('person')
    .select('id')
    .where('age', '>=', 18)
    .orderBy('id')
  const preview = base.limit(1)
  assert.notEqual(preview, base)
  assert.deepEqual(await preview.execute(), [{ id: 1 }])
  assert.deepEqual(await base.execute(), [{ id: 1 }, { id: 2 }, { id: 3 }])
  const factories = [
    () =>
      drizzleDb
        .select({ id: person.id })
        .from(person)
        .where(gte(person.age, 18))
        .orderBy(person.id),
    () =>
      rcDb
        .select({ id: rcPerson.id })
        .from(rcPerson)
        .where(rcGte(rcPerson.age, 18))
        .orderBy(rcPerson.id),
  ]
  for (const factory of factories) {
    const base = factory(),
      preview = base.limit(1)
    assert.equal(preview, base)
    assert.deepEqual(await base, [{ id: 1 }])
    assert.deepEqual(await factory().limit(1), [{ id: 1 }])
    assert.deepEqual(await factory(), [{ id: 1 }, { id: 2 }, { id: 3 }])
  }
  console.log(
    'PASS: Kysely branches independently; Drizzle stable/RC limit() mutates shared base; fresh-builder factories isolate both branches',
  )
} finally {
  await db.destroy()
}
