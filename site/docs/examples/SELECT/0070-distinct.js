export const distinct = `const persons = await db.selectFrom('person')
  .select('first_name')
  .distinct()
  .execute()`