export const nestedJsonbArray = `import { jsonbArrayFrom } from 'kysely/helpers/postgres'

const result = await db
  .selectFrom('person')
  .select((eb) => [
    'id',
    jsonbArrayFrom(
      eb.selectFrom('pet')
        .select(['pet.id as pet_id', 'pet.name'])
        .whereRef('pet.owner_id', '=', 'person.id')
        .orderBy('pet.name')
    ).as('pets')
  ])
  .execute()`