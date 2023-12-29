import { Kysely, UpdateResult } from '..'
import { Database } from '../shared'
import { expectType, expectError } from 'tsd'

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
  expectType<UpdateResult>(r1)

  const r3 = await db
    .updateTable('pet as p')
    .where('p.id', '=', '1')
    .set((eb) => ({ name: eb.ref('p.id') }))
    .executeTakeFirst()
  expectType<UpdateResult>(r1)

  // Non-existent column
  expectError(
    db
      .updateTable('pet as p')
      .where('p.id', '=', '1')
      .set({ not_a_column: 'Fluffy' })
  )

  // Non-existent column in a callback
  expectError(
    db
      .updateTable('pet as p')
      .where('p.id', '=', '1')
      .set((eb) => ({ not_a_column: 'Fluffy' }))
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
