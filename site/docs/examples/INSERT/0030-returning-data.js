export const returningData = `const result = await db
  .insertInto('person')
  .values({
    first_name: 'Jennifer',
    last_name: 'Aniston',
    age: 40,
  })
  .returning(['id', 'first_name as name'])
  .executeTakeFirstOrThrow()`