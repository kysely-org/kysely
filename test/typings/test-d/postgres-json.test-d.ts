import {
  jsonBuildObject,
  Kysely,
  jsonArrayFrom,
  jsonObjectFrom,
  sql,
  ExpressionBuilder,
} from '..'
import { Database } from '../shared'
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
        modified_at: eb.ref('modified_at'),
      }).as('name'),

    // Nest other people with same first name.
    (eb) =>
      jsonArrayFrom(
        eb
          .selectFrom('person as other')
          .where('other.id', '!=', eb.ref('person.id'))
          .where('other.first_name', '=', eb.ref('person.first_name'))
          .selectAll(),
      ).as('people_same_first_name'),

    // Nest an object that holds the first person that might be a match from the opposite gender and is not married.
    (eb) =>
      jsonObjectFrom(
        eb
          .selectFrom('person as match')
          .where('match.gender', '!=', eb.ref('person.gender'))
          .where('match.marital_status', '!=', 'married')
          .where(
            (eb) => eb.fn('abs', [eb('match.age', '-', eb.ref('person.age'))]),
            '<=',
            5,
          )
          .limit(1)
          .selectAll(),
      ).as('potential_match'),
  ])

  const r1 = await query.execute()

  expectType<
    {
      first_name: string
      pets: { name: string; species: 'dog' | 'cat' }[]
      doggo: { doggo_name: string } | null
      name: {
        first: string
        last: string | null
        full: string
        modified_at: string
      }
      people_same_first_name: {
        id: number
        first_name: string
        last_name: string | null
        age: number
        gender: 'male' | 'female' | 'other'
        marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
        modified_at: string
        deleted_at: string | null
      }[]
      potential_match: {
        id: number
        first_name: string
        last_name: string | null
        age: number
        gender: 'male' | 'female' | 'other'
        marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
        modified_at: string
        deleted_at: string | null
      } | null
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
    .selectFrom('pet')
    .innerJoin('person', 'pet.owner_id', 'person.id')
    .select((eb) => ['pet.name', eb.fn.jsonAgg('person').as('people')])
    .groupBy('pet.name')
    .execute()

  expectType<
    {
      name: string
      people: {
        id: number
        first_name: string
        last_name: string | null
        age: number
        gender: 'male' | 'female' | 'other'
        marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
        modified_at: string
        deleted_at: string | null
      }[]
    }[]
  >(r1)

  const r2 = await db
    .selectFrom('pet')
    .select((eb) => [
      'name',
      eb
        .selectFrom('person')
        .select((eb) => eb.fn.jsonAgg('person').as('people'))
        .whereRef('pet.owner_id', '=', 'person.id')
        .as('people'),
    ])
    .execute()

  expectType<
    {
      name: string
      people:
        | {
            id: number
            first_name: string
            last_name: string | null
            age: number
            gender: 'male' | 'female' | 'other'
            marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
            modified_at: string
            deleted_at: string | null
          }[]
        | null
    }[]
  >(r2)

  const r3 = await db
    .selectFrom('pet')
    .select((eb) => [
      'name',
      eb
        .selectFrom('person')
        .select((eb) => eb.fn.jsonAgg(eb.table('person')).as('people'))
        .whereRef('pet.owner_id', '=', 'person.id')
        .as('people'),
    ])
    .execute()

  expectType<
    {
      name: string
      people:
        | {
            id: number
            first_name: string
            last_name: string | null
            age: number
            gender: 'male' | 'female' | 'other'
            marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
            modified_at: string
            deleted_at: string | null
          }[]
        | null
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
          sql<[]>`'[]'`,
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
    .selectFrom('pet')
    .innerJoin('person', 'pet.owner_id', 'person.id')
    .select((eb) => [
      'name',
      eb.fn.jsonAgg('person.modified_at').as('modified_at'),
    ])
    .groupBy('name')
    .execute()

  expectType<
    {
      name: string
      modified_at: string[] | null
    }[]
  >(r5)
}

async function testPostgresToJson(db: Kysely<Database>) {
  const r1 = await db
    .selectFrom('pet')
    .innerJoin('person', 'pet.owner_id', 'person.id')
    .select((eb) => ['name', eb.fn.toJson('person').as('person')])
    .execute()

  expectType<
    {
      name: string
      person: {
        id: number
        first_name: string
        last_name: string | null
        age: number
        gender: 'male' | 'female' | 'other'
        marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
        modified_at: string
        deleted_at: string | null
      }
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
