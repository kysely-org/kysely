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
  firstName: string
  lastName: string
  age: number
  gender: 'male' | 'female' | 'other'
}

interface Animal {
  id: string
  name: string
  ownerId: number
  species: 'dog' | 'cat'
}

interface Movie {
  id: string
  stars: number
}

interface Tables {
  person: Person
  animal: Animal
  movie: Movie
  'someSchema.movie': Movie
}

async function testFromSingle(db: Kysely<Tables>) {
  // Single table
  const [r1] = await db.query('person').selectAll().execute()
  expectType<Person>(r1)

  // Table with alias
  const [r2] = await db.query('animal as a').select('a.species').execute()
  expectType<{ species: 'dog' | 'cat' }>(r2)

  // Subquery
  const [r3] = await db
    .query(db.query('movie').select('movie.stars as strs').as('m'))
    .selectAll()
    .execute()
  expectType<{ strs: number }>(r3)

  // Subquery factory
  const [r4] = await db
    .query(() => db.query('movie').select('movie.stars as strs').as('m'))
    .selectAll()
    .execute()
  expectType<{ strs: number }>(r4)

  // Table with schema
  const [r5] = await db.query('someSchema.movie').select('stars').execute()
  expectType<{ stars: number }>(r5)

  // Table with schema and alias
  const [r6] = await db
    .query('someSchema.movie as m')
    .select('m.stars')
    .execute()
  expectType<{ stars: number }>(r6)

  // Should not be able to select animal columns from person.
  expectError(db.query('person').select('animal.id'))

  // Should not be able to start a query against non-existent table.
  expectError(db.query('doesntExist'))
}

async function testFromMultiple(db: Kysely<Tables>) {
  const [r1] = await db
    .query([
      'person',
      'animal as a',
      db.query('movie').select('movie.id as movieId').as('m'),
    ])
    .select(['person.firstName', 'm.movieId', 'a.species'])
    .execute()
  expectType<{ firstName: string; movieId: string; species: 'dog' | 'cat' }>(r1)

  // Should not be able to select animal columns from person or movie.
  expectError(db.query(['person', 'movie']).select('animal.id'))

  // Should not be able to start a query against non-existent table.
  expectError(db.query(['person', 'doesntExist']))
}

async function testSelectSingle(db: Kysely<Tables>) {
  const qb = db.query('person')

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
    .select('firstName')
    .execute()
  expectType<{ firstName: string } & { [key: string]: unknown }>(r5)

  // Sub query
  const [r6] = await qb
    .select(db.query('movie').select('id').as('movieId'))
    .execute()
  expectType<{ movieId: string }>(r6)

  // Sub query factory
  const [r7] = await qb
    .select((qb) =>
      qb
        .subQuery('movie')
        .whereRef('movie.id', '=', 'person.id')
        .select('movie.id')
        .as('movieId')
    )
    .execute()
  expectType<{ movieId: string }>(r7)

  // Aliased table
  const [r8] = await db.query('animal as a').select('a.name').execute()
  expectType<{ name: string }>(r8)

  // Table with schema
  const [r9] = await db
    .query('someSchema.movie')
    .select('someSchema.movie.id')
    .execute()
  expectType<{ id: string }>(r9)

  // Aliased table with schema and selection with alias
  const [r10] = await db
    .query('someSchema.movie as sm')
    .select('sm.id as identifier')
    .execute()
  expectType<{ identifier: string }>(r10)

  expectError(qb.select('notProperty'))
  expectError(qb.select('person.notProperty'))
  expectError(qb.select('person.notProperty as np'))
}

async function testSelectMultiple(db: Kysely<Tables>) {
  const qb = db
    .query([
      'person',
      (qb) =>
        qb
          .subQuery('movie')
          .select(['movie.stars', 'movie.id as movieId'])
          .as('m'),
    ])
    .innerJoin('animal as a', 'id', 'id')

  const [r1] = await qb
    .select([
      'firstName',
      'person.age',
      'species',
      'a.name as petName',
      'm.stars',
      'movieId',
      db.raw<number>('random()').as('rand1'),
      db.raw<number>('random()').as('rand2'),
    ])
    .execute()

  expectType<{
    firstName: string
    age: number
    species: 'dog' | 'cat'
    petName: string
    stars: number
    movieId: string
    rand1: number
    rand2: number
  }>(r1)

  expectError(qb.select(['person.id', 'notColumn']))
  expectError(qb.select(['person.id', 'person.notColumn']))
  expectError(qb.select(['person.id', 'person.notColumn as foo']))
}

function testWhere(db: Kysely<Tables>) {
  db.query('person').where('person.age', '=', 25)
  db.query('person').where('person.age', db.raw('lol'), 25)
  db.query('person').where('firstName', '=', 'Arnold')
  db.query('someSchema.movie').where('someSchema.movie.id', '=', 1)

  // Invalid operator.
  expectError(db.query('person').where('person.age', 'lol', 25))

  // Invalid table.
  expectError(db.query('person').where('movie.stars', '=', 25))

  // Invalid column.
  expectError(db.query('person').where('stars', '=', 25))
}
