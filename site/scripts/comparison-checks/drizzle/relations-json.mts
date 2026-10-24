import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { Kysely, PGliteDialect, type InferResult } from 'kysely'
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres'
import { drizzle } from 'drizzle-stable/pglite'
import { integer, pgTable, text } from 'drizzle-stable/pg-core'
import { eq, asc, sql } from 'drizzle-stable'
import { drizzle as rcDrizzle } from 'drizzle-rc/pglite'
import {
  integer as rcInteger,
  pgTable as rcTable,
  text as rcText,
} from 'drizzle-rc/pg-core'
import { eq as rcEq, asc as rcAsc, sql as rcSql } from 'drizzle-rc'
interface Database {
  person: { id: number; first_name: string }
  pet: { id: number; name: string; owner_id: number }
}
const pglite = new PGlite()
const db = new Kysely<Database>({ dialect: new PGliteDialect({ pglite }) })
const person = pgTable('person', {
  id: integer().notNull(),
  first_name: text().notNull(),
})
const pet = pgTable('pet', {
  id: integer().notNull(),
  name: text().notNull(),
  owner_id: integer().notNull(),
})
const drizzleDb = drizzle(pglite)
const k = db
  .selectFrom('person')
  .select('person.id')
  .select((eb) =>
    jsonArrayFrom(
      eb
        .selectFrom('pet')
        .select(['pet.id as pet_id', 'pet.name'])
        .whereRef('pet.owner_id', '=', 'person.id')
        .orderBy('pet.name')
        .orderBy('pet.id')
        .limit(2),
    ).as('pets'),
  )
  .orderBy('person.id')
const petRows = drizzleDb
  .select({ pet_id: sql<number>`${pet.id}`.as('pet_id'), name: pet.name })
  .from(pet)
  .where(eq(pet.owner_id, person.id))
  .orderBy(asc(pet.name), asc(pet.id))
  .limit(2)
const d = drizzleDb
  .select({
    id: person.id,
    pets: sql<
      Awaited<typeof petRows>
    >`(select coalesce(json_agg(pet_rows), '[]'::json) from ${petRows.as('pet_rows')})`.as(
      'pets',
    ),
  })
  .from(person)
  .orderBy(person.id)
const rcPerson = rcTable('person', {
  id: rcInteger().notNull(),
  first_name: rcText().notNull(),
})
const rcPet = rcTable('pet', {
  id: rcInteger().notNull(),
  name: rcText().notNull(),
  owner_id: rcInteger().notNull(),
})
const rcDb = rcDrizzle({ client: pglite })
const rcPetRows = rcDb
  .select({ pet_id: rcSql<number>`${rcPet.id}`.as('pet_id'), name: rcPet.name })
  .from(rcPet)
  .where(rcEq(rcPet.owner_id, rcPerson.id))
  .orderBy(rcAsc(rcPet.name), rcAsc(rcPet.id))
  .limit(2)
const r = rcDb
  .select({
    id: rcPerson.id,
    pets: rcSql<
      Awaited<typeof rcPetRows>
    >`(select coalesce(json_agg(pet_rows), '[]'::json) from ${rcPetRows.as('pet_rows')})`.as(
      'pets',
    ),
  })
  .from(rcPerson)
  .orderBy(rcPerson.id)
const unaliasedPetRows = drizzleDb
  .select({ pet_id: pet.id, name: pet.name })
  .from(pet)
  .where(eq(pet.owner_id, person.id))
  .orderBy(asc(pet.name), asc(pet.id))
  .limit(2)
const unaliased = drizzleDb
  .select({
    id: person.id,
    pets: sql<
      Awaited<typeof unaliasedPetRows>
    >`(select coalesce(json_agg(pet_rows), '[]'::json) from ${unaliasedPetRows.as('pet_rows')})`.as(
      'pets',
    ),
  })
  .from(person)
  .orderBy(person.id)
const rcUnaliasedPetRows = rcDb
  .select({ pet_id: rcPet.id, name: rcPet.name })
  .from(rcPet)
  .where(rcEq(rcPet.owner_id, rcPerson.id))
  .orderBy(rcAsc(rcPet.name), rcAsc(rcPet.id))
  .limit(2)
const rcUnaliased = rcDb
  .select({
    id: rcPerson.id,
    pets: rcSql<
      Awaited<typeof rcUnaliasedPetRows>
    >`(select coalesce(json_agg(pet_rows), '[]'::json) from ${rcUnaliasedPetRows.as('pet_rows')})`.as(
      'pets',
    ),
  })
  .from(rcPerson)
  .orderBy(rcPerson.id)
const objectQuery = db
  .selectFrom('person')
  .select('person.id')
  .select((eb) =>
    jsonObjectFrom(
      eb
        .selectFrom('pet')
        .select(['pet.id as pet_id', 'pet.name'])
        .whereRef('pet.owner_id', '=', 'person.id')
        .orderBy('pet.name')
        .orderBy('pet.id')
        .limit(1),
    ).as('first_pet'),
  )
  .orderBy('person.id')
const aggregate = db
  .selectFrom('person')
  .innerJoin('pet', 'pet.owner_id', 'person.id')
  .select('person.id')
  .select((eb) => eb.fn.jsonAgg('pet.name').orderBy('pet.name').as('pet_names'))
  .groupBy('person.id')
  .orderBy('person.id')
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false
type Expect<T extends true> = T
type Expected = { id: number; pets: { pet_id: number; name: string }[] }[]
type K = Expect<Equal<InferResult<typeof k>, Expected>>
type D = Expect<Equal<Awaited<typeof d>, Expected>>
type R = Expect<Equal<Awaited<typeof r>, Expected>>
type O = Expect<
  Equal<
    InferResult<typeof objectQuery>,
    { id: number; first_pet: { pet_id: number; name: string } | null }[]
  >
>
try {
  await pglite.exec(
    "create table person(id integer,first_name text);create table pet(id integer,name text,owner_id integer);insert into person values(1,'Jennifer'),(2,'Arnold');insert into pet values(1,'Zulu',1),(2,'Alpha',1),(3,'Beta',1)",
  )
  const expected = [
    {
      id: 1,
      pets: [
        { pet_id: 2, name: 'Alpha' },
        { pet_id: 3, name: 'Beta' },
      ],
    },
    { id: 2, pets: [] },
  ]
  assert.deepEqual(await k.execute(), expected)
  const unaliasedExpected = [
    {
      id: 1,
      pets: [
        { id: 2, name: 'Alpha' },
        { id: 3, name: 'Beta' },
      ],
    },
    { id: 2, pets: [] },
  ]
  assert.deepEqual(await unaliased, unaliasedExpected)
  assert.deepEqual(await rcUnaliased, unaliasedExpected)
  assert.deepEqual(await d, expected)
  assert.deepEqual(await r, expected)
  assert.deepEqual(await objectQuery.execute(), [
    { id: 1, first_pet: { pet_id: 2, name: 'Alpha' } },
    { id: 2, first_pet: null },
  ])
  assert.deepEqual(await aggregate.execute(), [
    { id: 1, pet_names: ['Alpha', 'Beta', 'Zulu'] },
  ])
  console.log(
    'PASS: ordered/limited nested arrays and empty arrays match through real Drizzle stable/RC clients; Awaited reuses their inferred row type; Kysely object nullability and jsonAgg inference verified',
  )
} finally {
  await db.destroy()
}
