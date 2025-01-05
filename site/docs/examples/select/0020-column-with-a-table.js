export const columnWithATable = `const persons = await db
  .selectFrom(['person', 'pet'])
  .select('person.id')
  .execute()`