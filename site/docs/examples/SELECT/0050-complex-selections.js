export const complexSelections = `import { sql } from 'kysely'

const persons = await db.selectFrom('person')
  .select(({ eb, selectFrom, or }) => [
    // Select a correlated subquery
    selectFrom('pet')
      .whereRef('person.id', '=', 'pet.owner_id')
      .select('pet.name')
      .orderBy('pet.name')
      .limit(1)
      .as('first_pet_name'),

    // Build and select an expression using
    // the expression builder
    or([
      eb('first_name', '=', 'Jennifer'),
      eb('first_name', '=', 'Arnold')
    ]).as('is_jennifer_or_arnold'),

    // Select a raw sql expression
    sql<string>\`concat(first_name, ' ', last_name)\`.as('full_name')
  ])
  .execute()`