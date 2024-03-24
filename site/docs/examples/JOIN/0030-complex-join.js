export const complexJoin = `await db.selectFrom('person')
  .innerJoin(
    'pet',
    (join) => join
      .onRef('pet.owner_id', '=', 'person.id')
      .on('pet.name', '=', 'Doggo')
      .on((eb) => eb.or([
        eb('person.age', '>', 18),
        eb('person.age', '<', 100)
      ]))
  )
  .selectAll()
  .execute()`