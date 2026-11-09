import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { Kysely, PGliteDialect, type Selectable } from 'kysely'
import { jsonArrayFrom } from 'kysely/helpers/postgres'
import { and, eq, gte } from 'drizzle-stable'
import { integer, pgTable, text } from 'drizzle-stable/pg-core'
import { drizzle } from 'drizzle-stable/pglite'
import type { Kyselify } from 'drizzle-stable/kysely'
import {
  and as rcAnd,
  defineRelations,
  eq as rcEq,
  gte as rcGte,
} from 'drizzle-rc'
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
const rcRelations = defineRelations({ person: rcPerson, pet: rcPet }, (r) => ({
  person: { pets: r.many.pet({ from: r.person.id, to: r.pet.owner_id }) },
}))
const rcDb = rcDrizzle({ client: pglite, relations: rcRelations })

// The Drizzle table objects describe the same shapes as the Kysely interface.
type FromDrizzle = {
  person: Kyselify<typeof person>
  pet: Kyselify<typeof pet>
}
expectType<Equal<Selectable<FromDrizzle['person']>, Database['person']>>()
expectType<Equal<Selectable<FromDrizzle['pet']>, Database['pet']>>()
const derivedDb = new Kysely<FromDrizzle>({
  dialect: new PGliteDialect({ pglite }),
})

// Baseline: the same left join infers the same row in all three.
const kyselyJoin = db
  .selectFrom('person')
  .leftJoin('pet', 'pet.owner_id', 'person.id')
  .select(['person.first_name', 'pet.name as pet_name'])
  .where('person.age', '>=', 18)
  .orderBy('person.first_name')
const drizzleJoin = drizzleDb
  .select({ first_name: person.first_name, pet_name: pet.name })
  .from(person)
  .leftJoin(pet, eq(pet.owner_id, person.id))
  .where(gte(person.age, 18))
  .orderBy(person.first_name)
const rcJoin = rcDb
  .select({ first_name: rcPerson.first_name, pet_name: rcPet.name })
  .from(rcPerson)
  .leftJoin(rcPet, rcEq(rcPet.owner_id, rcPerson.id))
  .where(rcGte(rcPerson.age, 18))
  .orderBy(rcPerson.first_name)
type JoinRow = { first_name: string; pet_name: string | null }
expectType<Equal<Awaited<ReturnType<typeof kyselyJoin.execute>>, JoinRow[]>>()
expectType<Equal<Awaited<typeof drizzleJoin>, JoinRow[]>>()
expectType<Equal<Awaited<typeof rcJoin>, JoinRow[]>>()

// Nested pets: Drizzle 1.0's relational API and Kysely's JSON helper.
const rcNested = rcDb.query.person.findMany({
  columns: { first_name: true },
  orderBy: { first_name: 'asc' },
  with: {
    pets: { columns: { name: true }, orderBy: { name: 'asc' }, limit: 2 },
  },
})
const kyselyNested = db
  .selectFrom('person')
  .select((eb) => [
    'person.first_name',
    jsonArrayFrom(
      eb
        .selectFrom('pet')
        .select('pet.name')
        .whereRef('pet.owner_id', '=', 'person.id')
        .orderBy('pet.name')
        .limit(2),
    ).as('pets'),
  ])
  .orderBy('person.first_name')
type NestedRow = { first_name: string; pets: { name: string }[] }
expectType<Equal<Awaited<typeof rcNested>, NestedRow[]>>()
expectType<
  Equal<Awaited<ReturnType<typeof kyselyNested.execute>>, NestedRow[]>
>()

function compileChecks() {
  // Outside dynamic mode, Drizzle's types remove a method once it is called.
  drizzleDb
    .select({ id: person.id })
    .from(person)
    .where(gte(person.age, 18))
    // @ts-expect-error where is unavailable after where.
    .where(eq(person.first_name, 'Jennifer'))
  rcDb
    .select({ id: rcPerson.id })
    .from(rcPerson)
    .where(rcGte(rcPerson.age, 18))
    // @ts-expect-error where is unavailable after where.
    .where(rcEq(rcPerson.first_name, 'Jennifer'))
}
void compileChecks

// An async helper that means to return a builder for further composition.
async function drizzleAdults() {
  return drizzleDb
    .select({ id: person.id })
    .from(person)
    .where(gte(person.age, 18))
}
async function rcAdults() {
  return rcDb
    .select({ id: rcPerson.id })
    .from(rcPerson)
    .where(rcGte(rcPerson.age, 18))
}
async function kyselyAdults() {
  return db.selectFrom('person').select('id').where('age', '>=', 18)
}

try {
  await pglite.exec(
    "create table person(id integer,first_name text,age integer);create table pet(id integer,name text,owner_id integer);insert into person values(1,'Jennifer',20),(2,'Arnold',30),(3,'Sylvester',12);insert into pet values(1,'Catto',1)",
  )
  const expectedJoin: JoinRow[] = [
    { first_name: 'Arnold', pet_name: null },
    { first_name: 'Jennifer', pet_name: 'Catto' },
  ]
  assert.deepEqual(await kyselyJoin.execute(), expectedJoin)
  assert.deepEqual(await drizzleJoin, expectedJoin)
  assert.deepEqual(await rcJoin, expectedJoin)
  assert.deepEqual(
    await derivedDb
      .selectFrom('person')
      .leftJoin('pet', 'pet.owner_id', 'person.id')
      .select(['person.first_name', 'pet.name as pet_name'])
      .where('person.age', '>=', 18)
      .orderBy('person.first_name')
      .execute(),
    expectedJoin,
  )

  const expectedNested: NestedRow[] = [
    { first_name: 'Arnold', pets: [] },
    { first_name: 'Jennifer', pets: [{ name: 'Catto' }] },
    { first_name: 'Sylvester', pets: [] },
  ]
  assert.deepEqual(await rcNested, expectedNested)
  assert.deepEqual(await kyselyNested.execute(), expectedNested)

  // A schema chosen per query, without redeclaring tables.
  assert.match(
    db.withSchema('tenant_1').selectFrom('person').select('id').compile().sql,
    /from "tenant_1"\."person"/,
  )

  // Kysely: repeated where calls accumulate with AND, on independent branches.
  const base = db.selectFrom('person').select('id').where('age', '>=', 18)
  const named = base.where('first_name', '=', 'Jennifer')
  assert.match(named.compile().sql, /"age" >= \$1 and "first_name" = \$2/)
  assert.deepEqual(await named.execute(), [{ id: 1 }])
  assert.deepEqual(await base.orderBy('id').execute(), [{ id: 1 }, { id: 2 }])

  // Drizzle dynamic mode: a second where replaces the first, on the shared base.
  const dynamicBase = drizzleDb
    .select({ id: person.id })
    .from(person)
    .where(gte(person.age, 18))
    .$dynamic()
  const dynamicNamed = dynamicBase.where(eq(person.first_name, 'Sylvester'))
  assert.equal(dynamicNamed, dynamicBase)
  const stableSql = dynamicBase.toSQL()
  console.log('stable:', stableSql.sql, stableSql.params)
  const rcDynamicBase = rcDb
    .select({ id: rcPerson.id })
    .from(rcPerson)
    .where(rcGte(rcPerson.age, 18))
    .$dynamic()
  const rcDynamicNamed = rcDynamicBase.where(
    rcEq(rcPerson.first_name, 'Sylvester'),
  )
  assert.equal(rcDynamicNamed, rcDynamicBase)
  const rcSql = rcDynamicBase.toSQL()
  console.log('rc:', rcSql.sql, rcSql.params)
  for (const compiled of [stableSql, rcSql]) {
    assert.doesNotMatch(compiled.sql, /"age"/)
    assert.deepEqual(compiled.params, ['Sylvester'])
  }
  // The 12-year-old is returned: the age filter is gone.
  assert.deepEqual(await dynamicBase, [{ id: 3 }])
  assert.deepEqual(await rcDynamicBase, [{ id: 3 }])
  // Collecting conditions and calling where once keeps both.
  assert.deepEqual(
    await drizzleDb
      .select({ id: person.id })
      .from(person)
      .where(and(gte(person.age, 18), eq(person.first_name, 'Jennifer'))),
    [{ id: 1 }],
  )
  assert.deepEqual(
    await rcDb
      .select({ id: rcPerson.id })
      .from(rcPerson)
      .where(
        rcAnd(rcGte(rcPerson.age, 18), rcEq(rcPerson.first_name, 'Jennifer')),
      ),
    [{ id: 1 }],
  )

  // Awaiting the async helper executes the Drizzle query; Kysely returns a builder.
  const stableRows = await drizzleAdults()
  const rcRows = await rcAdults()
  assert(Array.isArray(stableRows))
  assert(Array.isArray(rcRows))
  assert.equal(stableRows.length, 2)
  assert.equal(rcRows.length, 2)
  const query = await kyselyAdults()
  assert.equal(typeof query.execute, 'function')
  assert.deepEqual(await query.where('first_name', '=', 'Jennifer').execute(), [
    { id: 1 },
  ])

  // Kysely's unqualified id after a join compiles; PostgreSQL calls it ambiguous.
  await assert.rejects(
    db
      .selectFrom('person')
      .innerJoin('pet', 'pet.owner_id', 'person.id')
      .select('id')
      .execute(),
    /ambiguous/,
  )
  // Drizzle's column objects are qualified once a join is present.
  const qualified = drizzleDb
    .select({ id: person.id })
    .from(person)
    .innerJoin(pet, eq(pet.owner_id, person.id))
    .toSQL().sql
  const rcQualified = rcDb
    .select({ id: rcPerson.id })
    .from(rcPerson)
    .innerJoin(rcPet, rcEq(rcPet.owner_id, rcPerson.id))
    .toSQL().sql
  assert.match(qualified, /select "person"\."id" from "person"/)
  assert.match(rcQualified, /select "person"\."id" from "person"/)
  console.log(
    'PASS: matching left-join rows and inferred types across Kysely and Drizzle stable/RC, including through Kyselify; RC relational query and jsonArrayFrom return the same nested rows and types; a second where() is a type error outside dynamic mode and replaces the first inside it; awaited async helpers execute Drizzle builders and return Kysely builders; ambiguous unqualified Kysely reference reaches PostgreSQL',
  )
} finally {
  await db.destroy()
}
