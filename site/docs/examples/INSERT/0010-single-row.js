export const singleRow = `const result = await db
  .insertInto('person')
  .values({
    first_name: 'Jennifer',
    last_name: 'Aniston',
    age: 40
  })
  .executeTakeFirst()

// The \`insertId\` is only available on dialects
// that automatically return the id of the inserted
// row such as MySQL and SQLite. On postgres, for example,
// you need to add a \`returning\` clause to the query to
// get anything out. See the "returning data" example.
console.log(result.insertId)`