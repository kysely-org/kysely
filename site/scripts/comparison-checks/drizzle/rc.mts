import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { eq } from 'drizzle-rc'
import { integer, pgTable, QueryBuilder, text } from 'drizzle-rc/pg-core'
import { Kysely, PGliteDialect } from 'kysely'
const person = pgTable('person', {
  id: integer().notNull(),
  first_name: text().notNull(),
})
const pet = pgTable('pet', {
  id: integer().notNull(),
  name: text().notNull(),
  owner_id: integer().notNull(),
})
const drizzleDb = new QueryBuilder()
// These expressions deliberately have no @ts-expect-error: Drizzle accepts them.
const invalidSelection = drizzleDb
  .select({ id: person.id, pet_name: pet.name })
  .from(person)
const invalidPredicate = drizzleDb
  .select({ id: person.id })
  .from(person)
  .where(eq(pet.name, 'Catto'))
const pets = drizzleDb.select({ owner_id: pet.owner_id }).from(pet).as('pets')
const invalidJoin = drizzleDb
  .select({ id: person.id })
  .from(person)
  .leftJoin(pets, eq(pet.owner_id, person.id))
const pglite = new PGlite()
const kyselyDb = new Kysely<{
  person: { id: number; first_name: string }
  pet: { id: number; name: string; owner_id: number }
}>({ dialect: new PGliteDialect({ pglite }) })
// @ts-expect-error pet has not been joined.
kyselyDb.selectFrom('person').select(['person.id', 'pet.name as pet_name'])
// @ts-expect-error pet is outside the predicate's query scope.
kyselyDb.selectFrom('person').select('id').where('pet.name', '=', 'Catto')
kyselyDb.selectFrom('person').leftJoin(
  (eb) => eb.selectFrom('pet').select('owner_id').as('pets'),
  // @ts-expect-error The joined subquery is pets, not pet.
  (join) => join.onRef('pet.owner_id', '=', 'person.id'),
)
try {
  await pglite.exec(
    'create table person (id integer, first_name text); create table pet (id integer, name text, owner_id integer);',
  )
  assert.throws(
    () => invalidSelection.toSQL(),
    /not part of the query|not joined/i,
  )
  for (const [name, query] of [
    ['predicate', invalidPredicate],
    ['subquery join', invalidJoin],
  ] as const) {
    const compiled = query.toSQL()
    await assert.rejects(
      pglite.query(compiled.sql, compiled.params),
      /missing FROM-clause entry for table "pet"/,
    )
    console.log(
      'rc: TypeScript accepted invalid ' +
        name +
        '; PostgreSQL rejected generated SQL',
    )
  }
  console.log(
    'rc: TypeScript accepted invalid selection; Drizzle rejected it during SQL generation',
  )
} finally {
  await kyselyDb.destroy()
}
