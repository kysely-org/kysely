export const mySqlJoins = `const result = await db
  .updateTable(['person', 'pet'])
  .set('person.first_name', 'Updated person')
  .set('pet.name', 'Updated doggo')
  .whereRef('person.id', '=', 'pet.owner_id')
  .where('person.id', '=', 1)
  .executeTakeFirst()`