export const insertsUpdatesAndDeletions = `const result = await db
  .with('new_person', (db) => db
    .insertInto('person')
    .values({
      first_name: 'Jennifer',
      age: 35,
    })
    .returning('id')
  )
  .with('new_pet', (db) => db
    .insertInto('pet')
    .values({
      name: 'Doggo',
      species: 'dog',
      is_favorite: true,
      // Use the id of the person we just inserted.
      owner_id: db
        .selectFrom('new_person')
        .select('id')
    })
    .returning('id')
  )
  .selectFrom(['new_person', 'new_pet'])
  .select([
    'new_person.id as person_id',
    'new_pet.id as pet_id'
  ])
  .execute()`