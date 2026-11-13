import assert from 'node:assert/strict'
import { expressionBuilder, sql } from 'kysely'
import { connect, sequelizeVersion, type Database } from './_setup.mts'

const { db, cleanup } = await connect()

// Kysely compiles an equality comparison with null, and it matches nothing.
assert.deepEqual(
  await db.selectFrom('person').select('id').where('age', '=', null).execute(),
  [],
)

// A union whose sides list the same columns in a different order.
const union = db
  .selectFrom('person')
  .select(['first_name as name', sql<string>`'person'`.as('kind')])
  .where('id', '=', 1)
  .union(
    db
      .selectFrom('pet')
      .select([sql<string>`'pet'`.as('kind'), 'name'])
      .where('id', '=', 1),
  )
const rows = await union.execute()
assert.deepEqual(
  rows.find((row) => row.kind === 'Catto'),
  { name: 'pet', kind: 'Catto' },
)

// References Kysely takes on trust: none is checked against the query.
const standalone = expressionBuilder<Database, 'pet'>()
const unjoined = db.selectFrom('person').select('person.id')
for (const query of [
  unjoined.where(standalone('pet.name', '=', 'Catto')),
  unjoined.select(sql<string>`lower(${sql.ref('pet.name')})`.as('name')),
  unjoined.select(sql<string>`lower(pet.name)`.as('name')),
  unjoined.select(db.dynamic.ref<'pet.name'>('pet.name')),
]) {
  await assert.rejects(
    query.execute(),
    /missing FROM-clause entry for table "pet"/,
  )
}

// The reference shorthands compare names, not types.
const mismatched = db
  .selectFrom('person')
  .innerJoin('pet', 'pet.name', 'person.id')
  .select('person.id')
assert.equal(
  mismatched.compile().sql,
  'select "person"."id" from "person" inner join "pet" on "pet"."name" = "person"."id"',
)
await assert.rejects(mismatched.execute(), /operator does not exist/)

// An unqualified column that two joined tables share compiles and is ambiguous.
await assert.rejects(
  db
    .selectFrom('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .select('id')
    .execute(),
  /ambiguous/,
)

await cleanup()
console.log(
  `PASS (Sequelize ${sequelizeVersion} installed; Kysely only): = null compiles and matches nothing, a union with reordered columns returns values under the wrong keys, sql.ref, template text, a dynamic reference, and a standalone expression builder reach PostgreSQL unchecked, the join shorthand compares names only, and an unqualified shared column is ambiguous at runtime`,
)
