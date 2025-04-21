export const complexValues = `const result = await db
  .updateTable('person')
  .set((eb) => ({
    age: eb('age', '+', 1),
    first_name: eb.selectFrom('pet').select('name').limit(1),
    last_name: 'updated',
  }))
  .where('id', '=', 1)
  .executeTakeFirst()`