export const allColumnsOfATable = `const persons = await db
  .selectFrom('person')
  .selectAll('person')
  .execute()`