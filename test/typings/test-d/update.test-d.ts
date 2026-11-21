import type { Kysely, UpdateResult } from '../index.js'
import type { Database } from '../shared.js'
import { expectType, expectError } from 'tsd'

async function testUpdateTableAliasMatchingTableName(db: Kysely<Database>) {
  db.updateTable('person as pet')
    .set({ first_name: 'Jennifer' })
    .where('pet.age', '>', 18)

  expectError(db.updateTable('person as pet').set({ species: 'cat' }))
  expectError(
    db
      .updateTable('person as pet')
      .set({ first_name: 'Jennifer' })
      .where('species', '=', 'cat'),
  )
}

async function testUpdate(db: Kysely<Database>) {
  const r1 = await db
    .updateTable('pet')
    .where('id', '=', '1')
    .set({ name: 'Fluffy' })
    .executeTakeFirst()
  expectType<UpdateResult>(r1)

  const r2 = await db
    .updateTable('pet as p')
    .where('p.id', '=', '1')
    .set({ name: 'Fluffy' })
    .executeTakeFirst()
  expectType<UpdateResult>(r2)

  const r3 = await db
    .updateTable('pet as p')
    .where('p.id', '=', '1')
    .set((eb) => ({ name: eb.ref('p.id') }))
    .executeTakeFirst()
  expectType<UpdateResult>(r3)

  const r4 = await db
    .updateTable('pet as p')
    .where('p.id', '=', '1')
    .set('name', 'Fluffy')
    .executeTakeFirst()
  expectType<UpdateResult>(r4)

  const r5 = await db
    .updateTable('pet')
    .from((eb) =>
      eb
        .selectFrom('person')
        .select(['person.id as person_id', 'first_name as fn'])
        .where('person.first_name', '=', 'Jennifer')
        .forUpdate()
        .skipLocked()
        .as('p'),
    )
    .set('name', (eb) => eb.ref('p.fn'))
    .returningAll('p')
    .execute()
  expectType<{ fn: string; person_id: number }[]>(r5)

  // Non-existent column
  expectError(
    db
      .updateTable('pet as p')
      .where('p.id', '=', '1')
      .set({ name: 'Fluffy', not_a_column: 'not_a_column' }),
  )

  // Non-existent column in a callback
  expectError(
    db
      .updateTable('pet as p')
      .where('p.id', '=', '1')
      .set((eb) => ({ not_a_column: eb.val('not_a_column') })),
  )

  // GeneratedAlways column is not allowed to be updated
  expectError(db.updateTable('book').set({ id: 1, name: 'foo' }))

  db.updateTable('book').set({ name: 'bar' })

  // Nullable column as undefined
  const mutationObject: { last_name: string | undefined } = {
    last_name: 'smith',
  }

  db.updateTable('person').set(mutationObject)
}

async function testUpdateWithJoins(db: Kysely<Database>) {
  const r1 = await db
    .updateTable('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .leftJoin('toy', 'toy.pet_id', 'pet.id')
    .set({ last_name: 'Jennifer' })
    .returning(['person.first_name', 'pet.name', 'toy.price'])
    .executeTakeFirstOrThrow()

  expectType<{ first_name: string; name: string; price: number | null }>(r1)

  const r2 = await db
    .updateTable('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .rightJoin('toy', 'toy.pet_id', 'pet.id')
    .set({ last_name: 'Jennifer' })
    .returning(['person.first_name', 'pet.name', 'toy.price'])
    .executeTakeFirstOrThrow()

  expectType<{ first_name: string | null; name: string | null; price: number }>(
    r2,
  )

  const r3 = await db
    .updateTable('person')
    .fullJoin('pet', 'pet.owner_id', 'person.id')
    .set({ last_name: 'Jennifer' })
    .returning(['person.first_name', 'pet.name'])
    .executeTakeFirstOrThrow()

  expectType<{ first_name: string | null; name: string | null }>(r3)

  const r4 = await db
    .updateTable('person')
    .leftJoin('toy as pet', 'pet.pet_id', 'person.id')
    .set({ last_name: 'Jennifer' })
    .returning(['person.first_name', 'pet.price'])
    .executeTakeFirstOrThrow()

  expectType<{ first_name: string; price: number | null }>(r4)
}
