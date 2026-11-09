import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import {
  Kysely,
  PGliteDialect,
  sql,
  type Expression,
  type ExpressionBuilder,
  type SqlBool,
} from 'kysely'
import { and, eq, gte } from 'drizzle-stable'
import { integer, pgTable, text } from 'drizzle-stable/pg-core'
import { drizzle } from 'drizzle-stable/pglite'
import { and as rcAnd, eq as rcEq, gte as rcGte } from 'drizzle-rc'
import {
  integer as rcInteger,
  pgTable as rcTable,
  text as rcText,
} from 'drizzle-rc/pg-core'
import { drizzle as rcDrizzle } from 'drizzle-rc/pglite'

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

type Options = { petName?: string }

// Drizzle, before: the join is present and the collected filters may read pet.
function drizzleBefore(options: Options) {
  const filters = [gte(person.age, 18)]
  if (options.petName) filters.push(eq(pet.name, options.petName))

  return drizzleDb
    .select({ first_name: person.first_name, pet_name: pet.name })
    .from(person)
    .leftJoin(pet, eq(pet.owner_id, person.id))
    .where(and(...filters))
}
// Drizzle, after: the pet name and the join are removed. This compiles.
function drizzleAfter(options: Options) {
  const filters = [gte(person.age, 18)]
  if (options.petName) filters.push(eq(pet.name, options.petName))

  return drizzleDb
    .select({ first_name: person.first_name })
    .from(person)
    .where(and(...filters))
}
function rcBefore(options: Options) {
  const filters = [rcGte(rcPerson.age, 18)]
  if (options.petName) filters.push(rcEq(rcPet.name, options.petName))

  return rcDb
    .select({ first_name: rcPerson.first_name, pet_name: rcPet.name })
    .from(rcPerson)
    .leftJoin(rcPet, rcEq(rcPet.owner_id, rcPerson.id))
    .where(rcAnd(...filters))
}
function rcAfter(options: Options) {
  const filters = [rcGte(rcPerson.age, 18)]
  if (options.petName) filters.push(rcEq(rcPet.name, options.petName))

  return rcDb
    .select({ first_name: rcPerson.first_name })
    .from(rcPerson)
    .where(rcAnd(...filters))
}

// Kysely, before.
function kyselyBefore(options: Options) {
  let query = db
    .selectFrom('person')
    .leftJoin('pet', 'pet.owner_id', 'person.id')
    .select(['person.first_name', 'pet.name as pet_name'])
    .where('person.age', '>=', 18)

  if (options.petName) {
    query = query.where('pet.name', '=', options.petName)
  }
  return query
}
// Kysely, after: the remaining pet filter no longer compiles.
function kyselyAfter(options: Options) {
  let query = db
    .selectFrom('person')
    .select('person.first_name')
    .where('person.age', '>=', 18)

  if (options.petName) {
    // @ts-expect-error pet is not available in this query.
    query = query.where('pet.name', '=', options.petName)
  }
  return query
}
void kyselyAfter

// Extracted Kysely helpers.
function petOnly(eb: ExpressionBuilder<Database, 'pet'>, options: Options) {
  return eb.and(options.petName ? [eb('pet.name', '=', options.petName)] : [])
}
function named(name: Expression<string>, petName: string) {
  return sql<SqlBool>`${name} = ${petName}`
}
function unionTyped(
  eb: ExpressionBuilder<Database, 'person' | 'pet'>,
  options: Options,
): Expression<SqlBool> {
  const filters = [eb('person.age', '>=', 18)]
  if (options.petName) filters.push(eb('pet.name', '=', options.petName))
  return eb.and(filters)
}
const unjoined = db.selectFrom('person').select('person.first_name')
const joined = db
  .selectFrom('person')
  .innerJoin('pet', 'pet.owner_id', 'person.id')
  .select('person.first_name')
function compileChecks() {
  // @ts-expect-error a helper typed with pet rejects a query without pet.
  unjoined.where((eb) => petOnly(eb, {}))
  // @ts-expect-error the reference is checked where the caller builds it.
  unjoined.where((eb) => named(eb.ref('pet.name'), 'Catto'))
  joined.where((eb) => petOnly(eb, {}))
  joined.where((eb) => named(eb.ref('pet.name'), 'Catto'))
  joined.where((eb) => unionTyped(eb, {}))
}
void compileChecks
// A helper typed with a union of tables accepts a query that has only one.
const unionOnUnjoined = unjoined.where((eb) =>
  unionTyped(eb, { petName: 'Catto' }),
)

try {
  await pglite.exec(
    "create table person(id integer,first_name text,age integer);create table pet(id integer,name text,owner_id integer);insert into person values(1,'Jennifer',20),(2,'Arnold',30),(3,'Sylvester',12);insert into pet values(1,'Catto',1)",
  )
  const byName = (a: { first_name: string }, b: { first_name: string }) =>
    a.first_name.localeCompare(b.first_name)

  for (const before of [drizzleBefore, rcBefore]) {
    assert.deepEqual((await before({})).sort(byName), [
      { first_name: 'Arnold', pet_name: null },
      { first_name: 'Jennifer', pet_name: 'Catto' },
    ])
    assert.deepEqual(await before({ petName: 'Catto' }), [
      { first_name: 'Jennifer', pet_name: 'Catto' },
    ])
  }
  // After the join is removed: fine without the option, rejected with it.
  for (const after of [drizzleAfter, rcAfter]) {
    assert.deepEqual((await after({})).sort(byName), [
      { first_name: 'Arnold' },
      { first_name: 'Jennifer' },
    ])
    await assert.rejects(
      async () => await after({ petName: 'Catto' }),
      (error: any) =>
        /missing FROM-clause entry for table "pet"/.test(
          String(error?.cause?.message ?? error?.message),
        ),
    )
  }

  assert.deepEqual(await kyselyBefore({ petName: 'Catto' }).execute(), [
    { first_name: 'Jennifer', pet_name: 'Catto' },
  ])
  await assert.rejects(
    unionOnUnjoined.execute(),
    /missing FROM-clause entry for table "pet"/,
  )

  console.log(
    'PASS: after a join is removed, Drizzle stable/RC still compile collected filters that read the removed table, run without the option, and fail in PostgreSQL with it; Kysely rejects the remaining filter, a helper typed with the removed table, and a reference passed as an expression; a Kysely helper typed with a union of tables accepts the unjoined query',
  )
} finally {
  await db.destroy()
}
