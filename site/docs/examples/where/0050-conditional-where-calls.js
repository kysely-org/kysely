export const conditionalWhereCalls = `import { Expression, SqlBool } from 'kysely'

const firstName: string | undefined = 'Jennifer'
const lastName: string | undefined = 'Aniston'
const under18 = true
const over60 = true

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

if (under18 || over60) {
  // Conditional OR expressions can be added like this.
  query = query.where((eb) => {
    const ors: Expression<SqlBool>[] = []

    if (under18) {
      ors.push(eb('age', '<', 18))
    }

    if (over60) {
      ors.push(eb('age', '>', 60))
    }

    return eb.or(ors)
  })
}

const persons = await query.execute()`