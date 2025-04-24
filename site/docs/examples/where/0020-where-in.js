export const whereIn = `const persons = await db
  .selectFrom('person')
  .selectAll()
  .where('id', 'in', [1, 2, 3])
  .execute()`