export const controlledTransaction = `const trx = await db.startTransaction().execute()

try {
  const jennifer = await trx.insertInto('person')
    .values({
      first_name: 'Jennifer',
      last_name: 'Aniston',
      age: 40,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  const catto = await trx.insertInto('pet')
    .values({
      owner_id: jennifer.id,
      name: 'Catto',
      species: 'cat',
      is_favorite: false,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  await trx.commit().execute()

  // ...
} catch (error) {
  await trx.rollback().execute()
}`