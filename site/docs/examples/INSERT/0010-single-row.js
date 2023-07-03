export const singleRow = `const result = await db
  .insertInto('person')
  .values({
    first_name: 'Jennifer',
    last_name: 'Aniston',
    age: 40
  })
  .executeTakeFirst()

console.log(result.insertId)`