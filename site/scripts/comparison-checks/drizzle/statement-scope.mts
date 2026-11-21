import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { Kysely, PGliteDialect } from 'kysely'
import { eq, gte } from 'drizzle-stable'
import { integer, pgTable, text, uuid } from 'drizzle-stable/pg-core'
import { drizzle } from 'drizzle-stable/pglite'
import { eq as rcEq, gte as rcGte } from 'drizzle-rc'
import {
  integer as rcInteger,
  pgTable as rcTable,
  text as rcText,
  uuid as rcUuid,
} from 'drizzle-rc/pg-core'
import { drizzle as rcDrizzle } from 'drizzle-rc/pglite'

interface Database {
  person: { id: number; first_name: string; age: number | null }
  pet: { id: string; name: string; owner_id: number }
}
const person = pgTable('person', {
  id: integer().notNull(),
  first_name: text().notNull(),
  age: integer(),
})
const pet = pgTable('pet', {
  id: uuid().notNull(),
  name: text().notNull(),
  owner_id: integer().notNull(),
})
const rcPerson = rcTable('person', {
  id: rcInteger().notNull(),
  first_name: rcText().notNull(),
  age: rcInteger(),
})
const rcPet = rcTable('pet', {
  id: rcUuid().notNull(),
  name: rcText().notNull(),
  owner_id: rcInteger().notNull(),
})

const pglite = new PGlite()
const db = new Kysely<Database>({ dialect: new PGliteDialect({ pglite }) })
const drizzleDb = drizzle(pglite)
const rcDb = rcDrizzle({ client: pglite })

const adults = drizzleDb
  .$with('adults')
  .as(
    drizzleDb.select({ id: person.id }).from(person).where(gte(person.age, 18)),
  )
const rcAdults = rcDb
  .$with('adults')
  .as(
    rcDb
      .select({ id: rcPerson.id })
      .from(rcPerson)
      .where(rcGte(rcPerson.age, 18)),
  )

// All of these compile in Drizzle without error suppressions.
const rejected = [
  () => drizzleDb.select({ id: person.id }).from(person).orderBy(pet.name),
  () => drizzleDb.select({ id: person.id }).from(person).groupBy(pet.name),
  () =>
    drizzleDb
      .select({ id: person.id })
      .from(person)
      .groupBy(person.id)
      .having(eq(pet.name, 'Catto')),
  () => drizzleDb.select().from(adults),
  () => drizzleDb.update(person).set({ first_name: pet.name }),
  () => drizzleDb.delete(person).where(eq(pet.name, 'Catto')),
  () => rcDb.select({ id: rcPerson.id }).from(rcPerson).orderBy(rcPet.name),
  () => rcDb.select({ id: rcPerson.id }).from(rcPerson).groupBy(rcPet.name),
  () =>
    rcDb
      .select({ id: rcPerson.id })
      .from(rcPerson)
      .groupBy(rcPerson.id)
      .having(rcEq(rcPet.name, 'Catto')),
  () => rcDb.select().from(rcAdults),
  () => rcDb.update(rcPerson).set({ first_name: rcPet.name }),
  () => rcDb.delete(rcPerson).where(rcEq(rcPet.name, 'Catto')),
]

// RETURNING another table's column: typed as the pet's uuid string.
const returning = () =>
  drizzleDb
    .insert(person)
    .values({ id: 9, first_name: 'Jennifer' })
    .returning({ petId: pet.id })
const rcReturning = () =>
  rcDb
    .insert(rcPerson)
    .values({ id: 10, first_name: 'Jennifer' })
    .returning({ petId: rcPet.id })

function compileChecks() {
  // @ts-expect-error pet is not available in this query.
  db.selectFrom('person').select('id').orderBy('pet.name')
  // @ts-expect-error pet is not available in this query.
  db.selectFrom('person').select('id').groupBy('pet.name')
  db.selectFrom('person')
    .select('id')
    .groupBy('id')
    // @ts-expect-error pet is not available in this query.
    .having('pet.name', '=', 'Catto')
  // @ts-expect-error adults was never attached with with().
  db.selectFrom('adults').selectAll()
  // @ts-expect-error pet is not available in this statement.
  db.updateTable('person').set((eb) => ({ first_name: eb.ref('pet.name') }))
  // @ts-expect-error pet is not available in this statement.
  db.deleteFrom('person').where('pet.name', '=', 'Catto')
  db.insertInto('person')
    .values({ id: 9, first_name: 'Jennifer' })
    // @ts-expect-error pet is not available in this statement.
    .returning('pet.id')
}
void compileChecks

try {
  await pglite.exec(
    "create table person(id integer,first_name text,age integer);create table pet(id uuid,name text,owner_id integer);insert into person values(1,'Jennifer',20)",
  )
  for (const build of rejected)
    await assert.rejects(
      async () => await build(),
      (error: any) =>
        /missing FROM-clause entry for table "pet"|relation "adults" does not exist/.test(
          String(error?.cause?.message ?? error?.message),
        ),
    )

  const rows: { petId: string }[] = await returning()
  const rcRows: { petId: string }[] = await rcReturning()
  assert.match(returning().toSQL().sql, /returning "id"$/)
  assert.match(rcReturning().toSQL().sql, /returning "id"$/)
  assert.deepEqual(rows, [{ petId: 9 }])
  assert.deepEqual(rcRows, [{ petId: 10 }])

  console.log(
    "PASS: Drizzle stable/RC compile another table's column in ORDER BY, GROUP BY, HAVING, SET, and a delete's WHERE, and a CTE that was never attached; PostgreSQL rejects each. RETURNING another table's column compiles, is written unqualified, and returns the target table's column under the other column's type. Kysely rejects all via types",
  )
} finally {
  await db.destroy()
}
