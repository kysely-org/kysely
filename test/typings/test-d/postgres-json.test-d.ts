import { jsonBuildObject, Kysely, jsonArrayFrom, jsonObjectFrom, sql } from '..'
import { Database } from '../shared'
import { expectType } from 'tsd'

async function testPostgresJsonb(db: Kysely<Database>) {
  const query = db.selectFrom('person').select([
    'person.first_name',

    // Nest all person's pets.
    (eb) =>
      jsonArrayFrom(
        eb
          .selectFrom('pet')
          .select(['name', 'species'])
          .whereRef('owner_id', '=', 'person.id')
          .orderBy('pet.name')
      ).as('pets'),

    // Nest the first found dog the person owns. Only select specific fields
    // and store it under a `doggo` field.
    (eb) =>
      jsonObjectFrom(
        eb
          .selectFrom('pet')
          .select('name as doggo_name')
          .whereRef('owner_id', '=', 'person.id')
          .where('species', '=', 'dog')
          .orderBy('name')
          .limit(1)
      ).as('doggo'),

    // Nest an object that holds the person's formatted name.
    (eb) =>
      jsonBuildObject({
        first: eb.ref('first_name'),
        last: eb.ref('last_name'),
        full: sql<string>`first_name || ' ' || last_name`,
      }).as('name'),
  ])

  const r1 = await query.execute()

  expectType<
    {
      first_name: string
      pets: { name: string; species: 'dog' | 'cat' }[]
      doggo: { doggo_name: string }
      name: { first: string; last: string | null; full: string }
    }[]
  >(r1)
}
