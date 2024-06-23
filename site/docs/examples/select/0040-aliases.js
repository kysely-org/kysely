export const aliases = `const persons = await db
  .selectFrom('person as p')
  .select([
    'first_name as fn',
    'p.last_name as ln'
  ])
  .execute()`