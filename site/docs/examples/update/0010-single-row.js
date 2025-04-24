export const singleRow = `const result = await db
  .updateTable('person')
  .set({
    first_name: 'Jennifer',
    last_name: 'Aniston'
  })
  .where('id', '=', 1)
  .executeTakeFirst()`