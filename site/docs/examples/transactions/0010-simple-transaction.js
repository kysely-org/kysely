export const simpleTransaction = `const catto = await db.transaction().execute(async (trx) => {
  const jennifer = await trx.insertInto('person')
    .values({
      first_name: 'Jennifer',
      last_name: 'Aniston',
      age: 40,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  return await trx.insertInto('pet')
    .values({
      owner_id: jennifer.id,
      name: 'Catto',
      species: 'cat',
      is_favorite: false,
    })
    .returningAll()
    .executeTakeFirst()
})`