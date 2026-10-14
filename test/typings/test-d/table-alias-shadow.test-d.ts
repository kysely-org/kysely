import { expectError, expectType } from 'tsd'
import type { Database } from '../shared.js'
import type { Kysely } from '../index.js'

// 1. selectFrom: colliding column types are those of the alias source
export async function testSelectFromCollidingColumns(db: Kysely<Database>) {
  const qb = db.selectFrom('person as pet')
  // id comes from Person (number), Pet.id is string. In baseline, id resolves to never.
  const [r1] = await qb.select('pet.id').execute()
  expectType<{ id: number }>(r1)
  const [r2] = await qb.select(['id', 'first_name']).execute()
  expectType<{ id: number; first_name: string }>(r2)
}

// 2. selectFrom: phantom columns from shadowed table are rejected
export async function testSelectFromPhantomColumns(db: Kysely<Database>) {
  const qb = db.selectFrom('person as pet')
  // Columns from shadowed Pet (species, owner_id) must not exist
  expectError(qb.select('pet.species'))
  expectError(qb.select('owner_id'))
}

// 3. updateTable: colliding column types are those of the alias source
export async function testUpdateTableCollidingColumns(db: Kysely<Database>) {
  const qb = db.updateTable('person as pet')
  // pet.id is number from Person. In baseline, pet.id is never, rejecting number.
  qb.set({ first_name: 'Alice' }).where('pet.id', '=', 1)
}

// 4. updateTable: phantom columns from shadowed table are rejected
export async function testUpdateTablePhantomColumns(db: Kysely<Database>) {
  const qb = db.updateTable('person as pet')
  // Phantom column species from Pet must be rejected in set and where
  expectError(qb.set({ species: 'cat' }))
  expectError(qb.where('pet.species', '=', 'cat'))
}

// 5. deleteFrom: colliding column types are those of the alias source
export async function testDeleteFromCollidingColumns(db: Kysely<Database>) {
  const qb = db.deleteFrom('person as pet')
  // pet.id is number from Person. In baseline, pet.id is never, rejecting number.
  qb.where('pet.id', '=', 1)
}

// 6. deleteFrom: phantom columns from shadowed table are rejected
export async function testDeleteFromPhantomColumns(db: Kysely<Database>) {
  const qb = db.deleteFrom('person as pet')
  // Phantom column species from Pet must be rejected
  expectError(qb.where('pet.species', '=', 'dog'))
}

// 7. mergeInto: phantom columns from shadowed table are rejected
export async function testMergeIntoPhantomColumns(db: Kysely<Database>) {
  const qb = db.mergeInto('person as pet')
  // Phantom column species from Pet must be rejected in thenUpdateSet
  expectError(
    qb
      .using('person', 'person.id', 'pet.id')
      .whenMatched()
      .thenUpdateSet({ species: 'dog' }),
  )
}

// 8. with (CTE): colliding column types are those of the alias source
export async function testCteCollidingColumns(db: Kysely<Database>) {
  const qb = db
    .with('pet', (db) => db.selectFrom('person').select(['id', 'first_name']))
    .selectFrom('pet')
  // id comes from Person (number). In baseline, id resolves to Pet.id (string).
  const [r1] = await qb.select('pet.id').execute()
  expectType<{ id: number }>(r1)
}

// 9. with (CTE): phantom columns from shadowed table are rejected
export async function testCtePhantomColumns(db: Kysely<Database>) {
  const qb = db
    .with('pet', (db) => db.selectFrom('person').select(['id', 'first_name']))
    .selectFrom('pet')
  // Phantom column species from shadowed Pet table must be rejected
  expectError(qb.select('pet.species'))
}
