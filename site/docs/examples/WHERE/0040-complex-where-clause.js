export const complexWhereClause = `const firstName = 'Jennifer'
const maxAge = 60

const persons = await db
  .selectFrom('person')
  .selectAll('person')
  .where(({ cmpr, or, and, not, exists, selectFrom }) => and([
    or([
      cmpr('first_name', '=', firstName),
      cmpr('age', '<', maxAge)
    ]),
    not(exists(
      selectFrom('pet')
        .select('pet.id')
        .whereRef('pet.owner_id', '=', 'person.id')
    ))
  ]))
  .execute()`