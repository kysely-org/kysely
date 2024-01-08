export const allColumns = `const persons = await db
  .selectFrom('person')
  .selectAll()
  .execute()`