export const conditionalWhereCalls = `const firstName: string | undefined = 'Jennifer'
const lastName: string | undefined = 'Aniston'

let query = db
  .selectFrom('person')
  .selectAll()

if (firstName) {
  // The query builder is immutable. Remember to reassign
  // the result back to the query variable.
  query = query.where('first_name', '=', firstName)
}

if (lastName) {
  query = query.where('last_name', '=', lastName)
}

const persons = await query.execute()`