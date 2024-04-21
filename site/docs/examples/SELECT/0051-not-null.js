export const notNull = `import { NotNull } from 'kysely'
import { jsonObjectFrom } from 'kysely/helpers/postgres'

const persons = db
  .selectFrom('person')
  .select((eb) => [
    'last_name',
     // Let's assume we know the person has at least one
     // pet. We can use the \`.$notNull()\` method to make
     // the expression not null. You could just as well
     // add \`pet\` to the \`$narrowType\` call below.
     jsonObjectFrom(
       eb.selectFrom('pet')
         .selectAll()
         .limit(1)
         .whereRef('person.id', '=', 'pet.owner_id')
     ).$notNull().as('pet')
  ])
  .where('last_name', 'is not', null)
  // $narrowType can be used to narrow the output type.
  // The special \`NotNull\` type can be used to make a
  // selection not null. You could add \`pet: NotNull\`
  // here and omit the \`$notNull()\` call on it.
  // Use whichever way you prefer.
  .$narrowType<{ last_name: NotNull }>()
  .execute()`