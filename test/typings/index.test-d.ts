/**
 * The type tests in this file can be run using `tsd`. Even though the unit
 * and integration tests should test most of the typings as well, this file is
 * needed to test some tricky typings that, if broken, don't necessarily show
 * up in the unit or integration tests. For example if the typings are broken
 * in a way that produces `any` types, the unit and integration tests are
 * happy, but we can catch it here.
 */

import { Kysely } from '.'
import { expectType, expectError } from 'tsd'

interface Person {
  id: number
  first_name: string
  last_name: string
  age: number
  gender: 'male' | 'female' | 'other'
}

interface Pet {
  id: string
  name: string
  owner_id: number
  species: 'dog' | 'cat'
}

interface Movie {
  id: string
  stars: number
}

interface Database {
  person: Person
  pet: Pet
  movie: Movie
  'some_schema.movie': Movie
}

async function testFromSingle(db: Kysely<Database>) {
  // Single table
  const [r1] = await db.selectFrom('person').selectAll().execute()
  expectType<Person>(r1)

  // Table with alias
  const [r2] = await db.selectFrom('pet as p').select('p.species').execute()
  expectType<{ species: 'dog' | 'cat' }>(r2)

  // Subquery
  const [r3] = await db
    .selectFrom(db.selectFrom('movie').select('movie.stars as strs').as('m'))
    .selectAll()
    .execute()
  expectType<{ strs: number }>(r3)

  // Subquery factory
  const [r4] = await db
    .selectFrom(() =>
      db.selectFrom('movie').select('movie.stars as strs').as('m')
    )
    .selectAll()
    .execute()
  expectType<{ strs: number }>(r4)

  // Table with schema
  const [r5] = await db
    .selectFrom('some_schema.movie')
    .select('stars')
    .execute()
  expectType<{ stars: number }>(r5)

  // Table with schema and alias
  const [r6] = await db
    .selectFrom('some_schema.movie as m')
    .select('m.stars')
    .execute()
  expectType<{ stars: number }>(r6)

  // Should not be able to select animal columns from person.
  expectError(db.selectFrom('person').select('pet.id'))

  // Should not be able to start a query against non-existent table.
  expectError(db.selectFrom('doesnt_exists'))
}

async function testFromMultiple(db: Kysely<Database>) {
  const [r1] = await db
    .selectFrom([
      'person',
      'pet as a',
      db.selectFrom('movie').select('movie.id as movie_id').as('m'),
    ])
    .select(['person.first_name', 'm.movie_id', 'a.species'])
    .execute()
  expectType<{ first_name: string; movie_id: string; species: 'dog' | 'cat' }>(
    r1
  )

  // Should not be able to select animal columns from person or movie.
  expectError(db.selectFrom(['person', 'movie']).select('pet.id'))

  // Should not be able to start a query against non-existent table.
  expectError(db.selectFrom(['person', 'doesnt_exists']))
}

async function testSelectSingle(db: Kysely<Database>) {
  const qb = db.selectFrom('person')

  // Column name
  const [r1] = await qb.select('id').execute()
  expectType<{ id: number }>(r1)

  // Table name and column name
  const [r2] = await qb.select('person.gender').execute()
  expectType<{ gender: 'male' | 'female' | 'other' }>(r2)

  // Table name and column name with alias
  const [r3] = await qb.select('person.age as a').execute()
  expectType<{ a: number }>(r3)

  // Raw selection
  const [r4] = await qb
    .select(db.raw<boolean>('random() > 0.5').as('rando'))
    .execute()
  expectType<{ rando: boolean }>(r4)

  // Raw selection with a dynamic alias.
  const alias = 'col_' + Math.round(Math.random() * 1000)
  const [r5] = await qb
    .select(db.raw('random() > 0.5').as(alias))
    .select('first_name')
    .execute()
  expectType<{ first_name: string } & { [key: string]: unknown }>(r5)

  // Sub query
  const [r6] = await qb
    .select(db.selectFrom('movie').select('id').as('movie_id'))
    .execute()
  expectType<{ movie_id: string }>(r6)

  // Sub query factory
  const [r7] = await qb
    .select((qb) =>
      qb
        .subQuery('movie')
        .whereRef('movie.id', '=', 'person.id')
        .select('movie.id')
        .as('movie_id')
    )
    .execute()
  expectType<{ movie_id: string }>(r7)

  // Aliased table
  const [r8] = await db.selectFrom('pet as p').select('p.name').execute()
  expectType<{ name: string }>(r8)

  // Table with schema
  const [r9] = await db
    .selectFrom('some_schema.movie')
    .select('some_schema.movie.id')
    .execute()
  expectType<{ id: string }>(r9)

  // Aliased table with schema and selection with alias
  const [r10] = await db
    .selectFrom('some_schema.movie as sm')
    .select('sm.id as identifier')
    .execute()
  expectType<{ identifier: string }>(r10)

  expectError(qb.select('not_property'))
  expectError(qb.select('person.not_property'))
  expectError(qb.select('person.not_property as np'))
}

async function testSelectMultiple(db: Kysely<Database>) {
  const qb = db
    .selectFrom([
      'person',
      (qb) =>
        qb
          .subQuery('movie')
          .select(['movie.stars', 'movie.id as movie_id'])
          .as('m'),
    ])
    .innerJoin('pet as p', 'id', 'id')

  const [r1] = await qb
    .select([
      'first_name',
      'person.age',
      'species',
      'p.name as pet_name',
      'm.stars',
      'movie_id',
      db.raw<number>('random()').as('rand1'),
      db.raw<number>('random()').as('rand2'),
    ])
    .execute()

  expectType<{
    first_name: string
    age: number
    species: 'dog' | 'cat'
    pet_name: string
    stars: number
    movie_id: string
    rand1: number
    rand2: number
  }>(r1)

  expectError(qb.select(['person.id', 'notColumn']))
  expectError(qb.select(['person.id', 'person.notColumn']))
  expectError(qb.select(['person.id', 'person.notColumn as foo']))
}

async function testSelectDynamic(db: Kysely<Database>) {
  const dynamicColumn = Math.random().toString()

  // Single dynamic column name
  const [r1] = await db
    .selectFrom('person')
    .select(db.dynamic.ref(dynamicColumn))
    .execute()
  expectType<{}>(r1)

  // Single dynamic column name with column options
  const [r2] = await db
    .selectFrom('person')
    .select(db.dynamic.ref<'first_name' | 'age'>(dynamicColumn))
    .execute()
  expectType<{ first_name: string | undefined; age: number | undefined }>(r2)

  // Static selections and a dynamic one
  const [r3] = await db
    .selectFrom('person')
    .select(['last_name', db.dynamic.ref(dynamicColumn)])
    .execute()
  expectType<{
    last_name: string
  }>(r3)

  // Static selections and a dynamic one
  const [r4] = await db
    .selectFrom(['person', 'pet'])
    .select([
      'last_name',
      db.dynamic.ref<'first_name' | 'person.age'>(dynamicColumn),
      db.dynamic.ref<'pet.name' | 'doesnt_exist'>(dynamicColumn),
    ])
    .execute()

  expectType<{
    last_name: string
    first_name: string | undefined
    age: number | undefined
    name: string | undefined
    doesnt_exist: never | undefined
  }>(r4)
}

function testWhere(db: Kysely<Database>) {
  db.selectFrom('person').where('person.age', '=', 25)
  db.selectFrom('person').where('person.age', db.raw('lol'), 25)
  db.selectFrom('person').where('first_name', '=', 'Arnold')
  db.selectFrom('some_schema.movie').where('some_schema.movie.id', '=', 1)

  // Invalid operator
  expectError(db.selectFrom('person').where('person.age', 'lol', 25))

  // Invalid table
  expectError(db.selectFrom('person').where('movie.stars', '=', 25))

  // Invalid column
  expectError(db.selectFrom('person').where('stars', '=', 25))
}

function testJoin(db: Kysely<Database>) {
  db.selectFrom('person').innerJoin('movie as m', (join) =>
    join.onRef('m.id', '=', 'person.id')
  )

  // Refer to table that's not joined
  expectError(
    db
      .selectFrom('person')
      .innerJoin('movie as m', (join) => join.onRef('pet.id', '=', 'person.id'))
  )

  // Refer to table with wrong alias
  expectError(
    db
      .selectFrom('person')
      .innerJoin('movie as m', (join) =>
        join.onRef('movie.id', '=', 'person.id')
      )
  )
}

function testInsert(db: Kysely<Database>) {
  db.insertInto('person').values({ first_name: 'Jennifer' })

  // Non-existent column
  expectError(db.insertInto('person').values({ not_column: 'foo' }))
}

async function testReturning(db: Kysely<Database>) {
  // One returning expression
  const r1 = await db
    .insertInto('person')
    .values({ first_name: 'Jennifer' })
    .returning('id')
    .executeTakeFirst()

  expectType<
    | {
        id: number
      }
    | undefined
  >(r1)

  // Multiple returning expressions
  const r2 = await db
    .insertInto('person')
    .values({ first_name: 'Jennifer' })
    .returning(['id', 'person.first_name as fn'])
    .executeTakeFirst()

  expectType<
    | {
        id: number
        fn: string
      }
    | undefined
  >(r2)

  // Non-existent column
  expectError(
    db
      .insertInto('person')
      .values({ first_name: 'Jennifer' })
      .returning('not_column')
  )
}
