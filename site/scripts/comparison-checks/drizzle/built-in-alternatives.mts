import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { Kysely, PGliteDialect } from 'kysely'
import { relations, sql, eq, count, asc } from 'drizzle-stable'
import { pgTable, integer, text } from 'drizzle-stable/pg-core'
import { drizzle } from 'drizzle-stable/pglite'
import {
  defineRelations,
  sql as rcSql,
  eq as rcEq,
  count as rcCount,
} from 'drizzle-rc'
import {
  pgTable as rcTable,
  integer as rcInteger,
  text as rcText,
} from 'drizzle-rc/pg-core'
import { drizzle as rcDrizzle } from 'drizzle-rc/pglite'
const pglite = new PGlite()
const person = pgTable('person', { id: integer().notNull() })
const pet = pgTable('pet', {
  id: integer().notNull(),
  name: text().notNull(),
  owner_id: integer().notNull(),
})
const personRelations = relations(person, ({ many }) => ({ pets: many(pet) }))
const petRelations = relations(pet, ({ one }) => ({
  owner: one(person, { fields: [pet.owner_id], references: [person.id] }),
}))
const db = drizzle(pglite, {
  schema: { person, pet, personRelations, petRelations },
})
const rcPerson = rcTable('person', { id: rcInteger().notNull() })
const rcPet = rcTable('pet', {
  id: rcInteger().notNull(),
  name: rcText().notNull(),
  owner_id: rcInteger().notNull(),
})
const rcRelations = defineRelations({ person: rcPerson, pet: rcPet }, (r) => ({
  person: { pets: r.many.pet({ from: r.person.id, to: r.pet.owner_id }) },
  pet: { owner: r.one.person({ from: r.pet.owner_id, to: r.person.id }) },
}))
const rcDb = rcDrizzle({ client: pglite, relations: rcRelations })
const nested = db.query.person.findMany({
  columns: { id: true },
  orderBy: [asc(person.id)],
  with: {
    pets: {
      columns: { name: true },
      extras: (t, { sql }) => ({ pet_id: sql<number>`${t.id}`.as('pet_id') }),
      orderBy: (t, { asc }) => [asc(t.name), asc(t.id)],
      limit: 2,
    },
  },
})
const rcNested = rcDb.query.person.findMany({
  columns: { id: true },
  orderBy: { id: 'asc' },
  with: {
    pets: {
      columns: { name: true },
      extras: { pet_id: (t) => rcSql<number>`${t.id}` },
      orderBy: { name: 'asc', id: 'asc' },
      limit: 2,
    },
  },
})
type Expected = { id: number; pets: { pet_id: number; name: string }[] }[]
const stableTyped: PromiseLike<Expected> = nested
const rcTyped: PromiseLike<Expected> = rcNested
void stableTyped
void rcTyped
const asset = pgTable('asset', {
  id: integer().notNull(),
  kind: text().notNull(),
})
const rcAsset = rcTable('asset', {
  id: rcInteger().notNull(),
  kind: rcText().notNull(),
})
const k = new Kysely<{ asset: { id: number; kind: string } }>({
  dialect: new PGliteDialect({ pglite }),
})
const kFiltered = k
  .selectFrom('asset')
  .select((eb) => [
    eb.fn
      .countAll<string>()
      .filterWhere('kind', '=', 'image')
      .as('image_count'),
    eb.fn
      .countAll<string>()
      .filterWhere('kind', '=', 'video')
      .as('video_count'),
  ])
const filtered = db
  .select({
    image_count: sql<string>`count(*) filter (where ${eq(asset.kind, 'image')})`,
    video_count: sql<string>`count(*) filter (where ${eq(asset.kind, 'video')})`,
  })
  .from(asset)
const rcFiltered = rcDb
  .select({
    image_count: rcSql<string>`count(*) filter (where ${rcEq(rcAsset.kind, 'image')})`,
    video_count: rcSql<string>`count(*) filter (where ${rcEq(rcAsset.kind, 'video')})`,
  })
  .from(rcAsset)
function typeChecks() {
  // @ts-expect-error count returns SQL<number>, not an aggregate-clause builder.
  count().filterWhere('kind', '=', 'image')
  // @ts-expect-error No FILTER builder method.
  count().filter(eq(asset.kind, 'image'))
  // @ts-expect-error No OVER builder method.
  count().over()
  // @ts-expect-error RC has no aggregate FILTER builder either.
  rcCount().filterWhere('kind', '=', 'image')
  // @ts-expect-error No FILTER builder method in RC.
  rcCount().filter(rcEq(rcAsset.kind, 'image'))
  // @ts-expect-error No OVER builder method in RC.
  rcCount().over()
}
void typeChecks
try {
  await pglite.exec(
    "create table person(id integer);create table pet(id integer,name text,owner_id integer);insert into person values(1),(2);insert into pet values(1,'Zulu',1),(2,'Alpha',1),(3,'Beta',1);create table asset(id integer,kind text);insert into asset values(1,'image'),(2,'video'),(3,'image'),(4,'audio')",
  )
  const expected: Expected = [
    {
      id: 1,
      pets: [
        { pet_id: 2, name: 'Alpha' },
        { pet_id: 3, name: 'Beta' },
      ],
    },
    { id: 2, pets: [] },
  ]
  assert.deepEqual(await nested, expected)
  assert.deepEqual(await rcNested, expected)
  for (const rows of [
    await kFiltered.execute(),
    await filtered,
    await rcFiltered,
  ])
    assert.deepEqual(
      rows.map((r) => ({
        image_count: String(r.image_count),
        video_count: String(r.video_count),
      })),
      [{ image_count: '2', video_count: '1' }],
    )
  assert.deepEqual(
    await db
      .select({ image_count: count() })
      .from(asset)
      .where(eq(asset.kind, 'image')),
    [{ image_count: 2 }],
  )
  assert.deepEqual(
    await rcDb
      .select({ image_count: rcCount() })
      .from(rcAsset)
      .where(rcEq(rcAsset.kind, 'image')),
    [{ image_count: 2 }],
  )
  assert.equal(await db.$count(asset, eq(asset.kind, 'image')), 2)
  assert.equal(await rcDb.$count(rcAsset, rcEq(rcAsset.kind, 'image')), 2)
  console.log(
    'PASS: stable/RC relational APIs return ordered, limited, renamed nested pets and [] without manual JSON aggregation; inferred shape matches Kysely.',
  )
  console.log(
    'PASS: built-in count()+where() and $count(table,filter) handle a single conditional count; simultaneous FILTER aggregates agree across all three libraries.',
  )
} finally {
  await k.destroy()
}
