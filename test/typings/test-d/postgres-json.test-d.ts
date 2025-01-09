import {
  jsonBuildObject,
  Kysely,
  jsonArrayFrom,
  jsonObjectFrom,
  sql,
  ExpressionBuilder,
  Selectable,
} from '..'
import { Database, Pet } from '../shared'
import { expectType } from 'tsd'

async function testPostgresJsonSelects(db: Kysely<Database>) {
  const query = db.selectFrom('person').select([
    'person.first_name',

    // Nest all person's pets.
    (eb) =>
      jsonArrayFrom(
        eb
          .selectFrom('pet')
          .select(['name', 'species'])
          .whereRef('owner_id', '=', 'person.id')
          .orderBy('pet.name'),
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
          .limit(1),
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
      doggo: { doggo_name: string } | null
      name: { first: string; last: string | null; full: string }
    }[]
  >(r1)
}

async function testPostgresConditionalJsonSelects(db: Kysely<Database>) {
  const query = db
    .selectFrom('person')
    .select(['person.first_name'])
    .$if(Math.random() < 0.5, (qb) => qb.select(withPets))
    .$if(Math.random() < 0.5, (qb) => qb.select(withDoggo))

  const r1 = await query.execute()

  expectType<
    {
      first_name: string
      pets?: { name: string; species: 'dog' | 'cat' }[]
      doggo?: { doggo_name: string } | null
    }[]
  >(r1)
}

async function testPostgresJsonAgg(db: Kysely<Database>) {
  const r1 = await db
    .selectFrom('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .select((eb) => ['first_name', eb.fn.jsonAgg('pet').as('pets')])
    .groupBy('person.first_name')
    .execute()

  expectType<
    {
      first_name: string
      pets: Selectable<Pet>[]
    }[]
  >(r1)

  const r2 = await db
    .selectFrom('person')
    .select((eb) => [
      'first_name',
      eb
        .selectFrom('pet')
        .select((eb) => eb.fn.jsonAgg('pet').as('pet'))
        .whereRef('pet.owner_id', '=', 'person.id')
        .as('pets'),
    ])
    .execute()

  expectType<
    {
      first_name: string
      pets: Selectable<Pet>[] | null
    }[]
  >(r2)

  const r3 = await db
    .selectFrom('person')
    .select((eb) => [
      'first_name',
      eb
        .selectFrom('pet')
        .select((eb) => eb.fn.jsonAgg(eb.table('pet')).as('pet'))
        .whereRef('pet.owner_id', '=', 'person.id')
        .as('pets'),
    ])
    .execute()

  expectType<
    {
      first_name: string
      pets: Selectable<Pet>[] | null
    }[]
  >(r3)

  const db2 = db.withTables<{
    acquisition: {
      id: number
    }
    transaction: {
      id: number
      acquisitionId: number
      status: string
    }
  }>()

  const r4 = await db2
    .selectFrom('acquisition')
    .leftJoin('transaction', 'transaction.acquisitionId', 'acquisition.id')
    .select(({ ref, fn }) => [
      'acquisition.id',
      fn
        .coalesce(
          fn
            .jsonAgg(
              jsonBuildObject({
                id: ref('transaction.id').$notNull(),
                status: ref('transaction.status'),
              }),
            )
            .filterWhere('transaction.id', 'is not', null),
          sql`'[]'`,
        )
        .as('transactions'),
    ])
    .groupBy('acquisition.id')
    .executeTakeFirstOrThrow()

  expectType<{
    id: number
    transactions: {
      id: number
      status: string | null
    }[]
  }>(r4)

  const r5 = await db
    .selectFrom('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .select((eb) => ['first_name', eb.fn.jsonAgg('owner_id').as('pet_names')])
    .groupBy('person.first_name')
    .execute()

  expectType<
    {
      first_name: string
      pet_names: number[] | null
    }[]
  >(r5)

  const r6 = await db
    .selectFrom('person')
    .select((eb) => [
      'first_name',
      eb
        .selectFrom('pet')
        .select((eb) => [eb.fn.jsonAgg('pet.owner_id').as('pet_names')])
        .whereRef('pet.owner_id', '=', 'person.id')
        .as('pet_names'),
    ])
    .execute()

  expectType<
    {
      first_name: string
      pet_names: number[] | null
    }[]
  >(r6)
}

async function testPostgresToJson(db: Kysely<Database>) {
  const r1 = await db
    .selectFrom('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .select((eb) => ['first_name', eb.fn.toJson('pet').as('pet')])
    .execute()

  expectType<
    {
      first_name: string
      pet: Selectable<Pet>
    }[]
  >(r1)
}

function withPets(eb: ExpressionBuilder<Database, 'person'>) {
  return jsonArrayFrom(
    eb
      .selectFrom('pet')
      .select(['name', 'species'])
      .whereRef('owner_id', '=', 'person.id')
      .orderBy('pet.name'),
  ).as('pets')
}

function withDoggo(eb: ExpressionBuilder<Database, 'person'>) {
  return jsonObjectFrom(
    eb
      .selectFrom('pet')
      .select('name as doggo_name')
      .whereRef('owner_id', '=', 'person.id')
      .where('species', '=', 'dog')
      .orderBy('name')
      .limit(1),
  ).as('doggo')
}
