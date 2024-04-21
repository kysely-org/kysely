export const simpleSelects = `const result = await db
  // Create a CTE called \`jennifers\` that selects all
  // persons named 'Jennifer'.
  .with('jennifers', (db) => db
    .selectFrom('person')
    .where('first_name', '=', 'Jennifer')
    .select(['id', 'age'])
  )
  // Select all rows from the \`jennifers\` CTE and
  // further filter it.
  .with('adult_jennifers', (db) => db
    .selectFrom('jennifers')
    .where('age', '>', 18)
    .select(['id', 'age'])
  )
  // Finally select all adult jennifers that are
  // also younger than 60.
  .selectFrom('adult_jennifers')
  .where('age', '<', 60)
  .selectAll()
  .execute()`