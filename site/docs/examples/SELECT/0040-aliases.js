export const aliases = `const persons = await db
  .selectFrom('person')
  .select([
    'first_name as fn',
    'person.last_name as ln'
  ])
  .execute()`