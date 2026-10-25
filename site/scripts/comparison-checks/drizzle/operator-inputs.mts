import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { Kysely, PGliteDialect, sql as ksql } from 'kysely'
import { eq, and, not, sql } from 'drizzle-stable'
import { pgTable, integer, text, QueryBuilder } from 'drizzle-stable/pg-core'
import {
  eq as rcEq,
  and as rcAnd,
  not as rcNot,
  sql as rcSql,
} from 'drizzle-rc'
import {
  pgTable as rcTable,
  integer as rcInteger,
  text as rcText,
  QueryBuilder as RcBuilder,
} from 'drizzle-rc/pg-core'
const person = pgTable('person', {
  id: integer().notNull(),
  first_name: text().notNull(),
})
const pet = pgTable('pet', { id: integer().notNull(), name: text().notNull() })
const rcPerson = rcTable('person', {
  id: rcInteger().notNull(),
  first_name: rcText().notNull(),
})
const rcPet = rcTable('pet', {
  id: rcInteger().notNull(),
  name: rcText().notNull(),
})
const stable = new QueryBuilder(),
  rc = new RcBuilder()
// All these calls deliberately compile without error suppressions.
const inputs = [
  eq(person.first_name, person.id),
  and(person.id),
  not(person.id),
]
const rcInputs = [
  rcEq(rcPerson.first_name, rcPerson.id),
  rcAnd(rcPerson.id),
  rcNot(rcPerson.id),
]
eq(sql<string>`${person.first_name}`, 42)
rcEq(rcSql<string>`${rcPerson.first_name}`, 42)
const fragment = stable
  .select({ name: sql<string>`lower(${pet.name})`.as('name') })
  .from(person)
const rcFragment = rc
  .select({ name: rcSql<string>`lower(${rcPet.name})`.as('name') })
  .from(rcPerson)
const pglite = new PGlite()
const db = new Kysely<{
  person: { id: number; first_name: string }
  pet: { id: number; name: string }
}>({ dialect: new PGliteDialect({ pglite }) })
function compileChecks() {
  // @ts-expect-error Drizzle does reject an incompatible primitive column value.
  eq(person.id, 'one')
  // @ts-expect-error RC has the same primitive-value check.
  rcEq(rcPerson.id, 'one')
  db.selectFrom('person').where((eb) =>
    // @ts-expect-error string and number expression operands are incompatible.
    eb('first_name', '=', eb.ref('id')),
  )
  db.selectFrom('person').where((eb) =>
    // @ts-expect-error and requires boolean expressions.
    eb.and([eb.ref('id')]),
  )
  // @ts-expect-error A non-boolean negation is not a valid WHERE condition.
  db.selectFrom('person').where((eb) => eb.not(eb.ref('id')))
  db.selectFrom('person').where((eb) =>
    // @ts-expect-error SQL expression is typed string, not number.
    eb(ksql<string>`${eb.ref('first_name')}`, '=', 42),
  )
  db.selectFrom('person').select((eb) =>
    // @ts-expect-error pet has not been joined, including inside a fragment.
    ksql<string>`lower(${eb.ref('pet.name')})`.as('name'),
  )
}
void compileChecks
async function execute(q: { toSQL(): { sql: string; params: any[] } }) {
  const c = q.toSQL()
  return (await pglite.query(c.sql, c.params)).rows
}
try {
  await pglite.exec(
    "create table person(id integer,first_name text);create table pet(id integer,name text);insert into person values(1,'Jennifer')",
  )
  for (const input of inputs)
    await assert.rejects(
      execute(stable.select({ id: person.id }).from(person).where(input)),
      /operator does not exist|must be type boolean/,
    )
  for (const input of rcInputs)
    await assert.rejects(
      execute(rc.select({ id: rcPerson.id }).from(rcPerson).where(input)),
      /operator does not exist|must be type boolean/,
    )
  for (const query of [fragment, rcFragment])
    await assert.rejects(execute(query), /does not exist|missing FROM-clause/)
  const valid = await db
    .selectFrom('person')
    .select((eb) => ksql<string>`lower(${eb.ref('first_name')})`.as('name'))
    .execute()
  assert.deepEqual(valid, [{ name: 'jennifer' }])
  console.log(
    'PASS: both Drizzle versions accept invalid expression operands and boolean inputs; PostgreSQL rejects them. Kysely rejects all via types, including unavailable fragment references; valid checked fragment executes.',
  )
} finally {
  await db.destroy()
}
