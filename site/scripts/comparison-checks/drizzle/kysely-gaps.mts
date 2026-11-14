import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { Kysely, PGliteDialect, expressionBuilder, sql } from 'kysely'
import { eq, sql as drizzleSql } from 'drizzle-stable'
import { integer, pgTable, text, union } from 'drizzle-stable/pg-core'
import { drizzle } from 'drizzle-stable/pglite'
import { eq as rcEq, sql as rcSql } from 'drizzle-rc'
import {
  integer as rcInteger,
  pgTable as rcTable,
  text as rcText,
  union as rcUnion,
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

// Kysely compiles an equality comparison with null.
const kyselyNull = db.selectFrom('person').select('id').where('age', '=', null)
function compileChecks() {
  // @ts-expect-error Drizzle rejects null as an eq() operand.
  eq(person.age, null)
  // @ts-expect-error RC has the same check.
  rcEq(rcPerson.age, null)
}
void compileChecks

// A union whose sides select the same columns in a different order.
const kyselyUnion = db
  .selectFrom('person')
  .select(['first_name as name', sql<string>`'person'`.as('kind')])
  .union(db.selectFrom('pet').select([sql<string>`'pet'`.as('kind'), 'name']))
const drizzleUnion = () =>
  union(
    drizzleDb
      .select({
        name: person.first_name,
        kind: drizzleSql<string>`'person'`.as('kind'),
      })
      .from(person),
    drizzleDb
      .select({ kind: drizzleSql<string>`'pet'`.as('kind'), name: pet.name })
      .from(pet),
  )
const rcDrizzleUnion = () =>
  rcUnion(
    rcDb
      .select({
        name: rcPerson.first_name,
        kind: rcSql<string>`'person'`.as('kind'),
      })
      .from(rcPerson),
    rcDb
      .select({ kind: rcSql<string>`'pet'`.as('kind'), name: rcPet.name })
      .from(rcPet),
  )

// References Kysely takes on trust: none of these is checked against the query.
const standalone = expressionBuilder<Database, 'pet'>()
const unjoined = db.selectFrom('person').select('person.id')
const trusted = [
  unjoined.where(standalone('pet.name', '=', 'Catto')),
  unjoined.select(sql<string>`lower(${sql.ref('pet.name')})`.as('name')),
  unjoined.select(sql<string>`lower(pet.name)`.as('name')),
  unjoined.select(db.dynamic.ref<'pet.name'>('pet.name')),
]

try {
  await pglite.exec(
    "create table person(id integer,first_name text,age integer);create table pet(id integer,name text,owner_id integer);insert into person values(1,'Jennifer',null);insert into pet values(1,'Catto',1)",
  )
  // Jennifer's age is null, and age = null matches nothing.
  assert.deepEqual(await kyselyNull.execute(), [])

  // Kysely sends the union; the pet row comes back under swapped keys.
  const rows = await kyselyUnion.execute()
  assert.deepEqual(
    rows.find((row) => row.kind === 'Catto'),
    { name: 'pet', kind: 'Catto' },
  )
  // Drizzle refuses to build it.
  assert.throws(drizzleUnion, /selected fields are not the same/)
  assert.throws(rcDrizzleUnion, /selected fields are not the same/)

  for (const query of trusted)
    await assert.rejects(
      query.execute(),
      /missing FROM-clause entry for table "pet"/,
    )

  console.log(
    'PASS: Kysely compiles = null and returns no rows where Drizzle stable/RC reject it via types; Kysely sends a union with reordered columns and returns values under the wrong keys where Drizzle stable/RC throw before sending; Kysely compiles a pet reference on a person query through sql.ref, template text, a dynamic reference, and a standalone expression builder, and PostgreSQL rejects each',
  )
} finally {
  await db.destroy()
}
