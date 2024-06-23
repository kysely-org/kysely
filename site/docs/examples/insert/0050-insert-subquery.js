export const insertSubquery = `const result = await db.insertInto('person')
  .columns(['first_name', 'last_name', 'age'])
  .expression((eb) => eb
    .selectFrom('pet')
    .select((eb) => [
      'pet.name',
      eb.val('Petson').as('last_name'),
      eb.lit(7).as('age'),
    ])
  )
  .execute()`