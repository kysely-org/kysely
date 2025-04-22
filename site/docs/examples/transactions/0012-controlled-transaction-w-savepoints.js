export const controlledTransactionWSavepoints = `const trx = await db.startTransaction().execute()

try {
  const jennifer = await trx
    .insertInto('person')
    .values({
      first_name: 'Jennifer',
      last_name: 'Aniston',
      age: 40,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  const trxAfterJennifer = await trx.savepoint('after_jennifer').execute()

  try {
    const catto = await trxAfterJennifer
      .insertInto('pet')
      .values({
        owner_id: jennifer.id,
        name: 'Catto',
        species: 'cat',
      })
      .returning('id')
      .executeTakeFirstOrThrow()

    await trxAfterJennifer
      .insertInto('toy')
      .values({ name: 'Bone', price: 1.99, pet_id: catto.id })
      .execute()
  } catch (error) {
    await trxAfterJennifer.rollbackToSavepoint('after_jennifer').execute()
  }

  await trxAfterJennifer.releaseSavepoint('after_jennifer').execute()

  await trx.insertInto('audit').values({ action: 'added Jennifer' }).execute()

  await trx.commit().execute()
} catch (error) {
  await trx.rollback().execute()
}`