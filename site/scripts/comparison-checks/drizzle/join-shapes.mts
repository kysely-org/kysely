import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { Kysely, PGliteDialect } from 'kysely'
import { eq } from 'drizzle-stable'
import { integer, pgTable, text } from 'drizzle-stable/pg-core'
import { drizzle } from 'drizzle-stable/pglite'
import { eq as rcEq } from 'drizzle-rc'
import {
  integer as rcInteger,
  pgTable as rcTable,
  text as rcText,
} from 'drizzle-rc/pg-core'
import { drizzle as rcDrizzle } from 'drizzle-rc/pglite'

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false
function expectType<T extends true>() {}

interface Database {
  person: { id: number; first_name: string; age: number | null }
  pet: { id: number; name: string; owner_id: number }
}
const person = pgTable('person', {
  id: integer().notNull(),
  first_name: text().notNull(),
  age: integer(),
})
const pet = pgTable('pet', {
  id: integer().notNull(),
  name: text().notNull(),
  owner_id: integer().notNull(),
})
const rcPerson = rcTable('person', {
  id: rcInteger().notNull(),
  first_name: rcText().notNull(),
  age: rcInteger(),
})
const rcPet = rcTable('pet', {
  id: rcInteger().notNull(),
  name: rcText().notNull(),
  owner_id: rcInteger().notNull(),
})

const pglite = new PGlite()
const db = new Kysely<Database>({ dialect: new PGliteDialect({ pglite }) })
const drizzleDb = drizzle(pglite)
const rcDb = rcDrizzle({ client: pglite })

// Drizzle: joined columns selected as a nested object are null as a whole.
const drizzleNested = drizzleDb
  .select({
    first_name: person.first_name,
    pet: { id: pet.id, name: pet.name },
  })
  .from(person)
  .leftJoin(pet, eq(pet.owner_id, person.id))
  .orderBy(person.id)
const rcNested = rcDb
  .select({
    first_name: rcPerson.first_name,
    pet: { id: rcPet.id, name: rcPet.name },
  })
  .from(rcPerson)
  .leftJoin(rcPet, rcEq(rcPet.owner_id, rcPerson.id))
  .orderBy(rcPerson.id)
type NestedRow = {
  first_name: string
  pet: { id: number; name: string } | null
}
expectType<Equal<Awaited<typeof drizzleNested>, NestedRow[]>>()
expectType<Equal<Awaited<typeof rcNested>, NestedRow[]>>()

// Kysely: each joined column is nullable on its own.
const kyselyFlat = db
  .selectFrom('person')
  .leftJoin('pet', 'pet.owner_id', 'person.id')
  .select(['person.first_name', 'pet.id as pet_id', 'pet.name as pet_name'])
  .orderBy('person.id')
type FlatRow = {
  first_name: string
  pet_id: number | null
  pet_name: string | null
}
expectType<Equal<Awaited<ReturnType<typeof kyselyFlat.execute>>, FlatRow[]>>()

try {
  await pglite.exec(
    "create table person(id integer,first_name text,age integer);create table pet(id integer,name text,owner_id integer);insert into person values(1,'Jennifer',20),(2,'Arnold',30);insert into pet values(1,'Catto',1)",
  )

  const nested = [
    { first_name: 'Jennifer', pet: { id: 1, name: 'Catto' } },
    { first_name: 'Arnold', pet: null },
  ]
  assert.deepEqual(await drizzleNested, nested)
  assert.deepEqual(await rcNested, nested)

  assert.deepEqual(await kyselyFlat.execute(), [
    { first_name: 'Jennifer', pet_id: 1, pet_name: 'Catto' },
    { first_name: 'Arnold', pet_id: null, pet_name: null },
  ])

  console.log(
    'PASS: Drizzle stable/RC type and return a left-joined nested object as null as a whole; Kysely types each joined column as nullable on its own',
  )
} finally {
  await db.destroy()
}
