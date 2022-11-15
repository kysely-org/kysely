import { expectError, expectType } from 'tsd'
import { Kysely, UpdateResult } from '..'
import { Database } from '../shared'

async function testUpdate(db: Kysely<Database>) {
  const r1 = await db
    .updateTable('pet as p')
    .where('p.id', '=', '1')
    .set({ name: 'Fluffy' })
    .executeTakeFirst()

  expectType<UpdateResult>(r1)

  // Non-existent column
  expectError(
    db
      .updateTable('pet as p')
      .where('p.id', '=', '1')
      .set({ not_a_column: 'Fluffy' })
  )

  // GeneratedAlways column is not allowed to be updated
  expectError(db.updateTable('book').set({ id: 1, name: 'foo' }))

  db.updateTable('book').set({ name: 'bar' })

  // Nullable column as undefined
  const mutationObject: { last_name: string | undefined } = {
    last_name: 'smith',
  }

  db.updateTable('person').set(mutationObject)

  const dinosaurs = ['T-Rex']

  // Non-existent column wrapped in spreaded object
  const badMutationObject = {
    ...(dinosaurs != null && { dinosaurs: ['hello'] }),
    first_name: 'John',
  } as const

  expectError(db.updateTable('person').set(badMutationObject))
}
