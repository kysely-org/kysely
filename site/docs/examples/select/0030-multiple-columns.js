export const multipleColumns = `const persons = await db
  .selectFrom('person')
  .select(['person.id', 'first_name'])
  .execute()`