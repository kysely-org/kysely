/**
 * The type tests in this file can be run using `tsd`. Even though the unit
 * and integration tests should test most of the typings as well, this file is
 * needed to test some tricky typings that, if broken, don't necessarily show
 * up in the unit or integration tests. For example if the typings are broken
 * in a way that produces `any` types, the unit and integration tests are
 * happy, but we can catch it here.
 */

import { Kysely, QueryBuilder, Transaction } from '.'
import { expectType, expectError } from 'tsd'

interface Person {
  id: number
  first_name: string
  last_name: string | null
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

  // Raw expression
  const [r7] = await db
    .selectFrom(db.raw<{ one: 1 }>('(select 1 as one)').as('o'))
    .select('o.one')
    .execute()
  expectType<{ one: 1 }>(r7)

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

  // Column name with alias
  const [r11] = await qb.select('id as identifier').execute()
  expectType<{ identifier: number }>(r11)

  // FunctionBuilder call
  const [r12] = await qb
    .select(db.fn.max('first_name').as('max_first_name'))
    .execute()
  expectType<{ max_first_name: string }>(r12)

  // FunctionBuilder call throug expression builder
  const [r13] = await qb
    .select((qb) => qb.fn.max('first_name').as('max_first_name'))
    .execute()
  expectType<{ max_first_name: string }>(r13)

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
      'species as sp',
      'p.name as pet_name',
      'm.stars',
      'movie_id',
      db.raw<number>('random()').as('rand1'),
      db.raw<number>('random()').as('rand2'),
      (qb) => qb.subQuery('pet').select('pet.id').as('sub'),
    ])
    .execute()

  expectType<{
    first_name: string
    age: number
    sp: 'dog' | 'cat'
    pet_name: string
    stars: number
    movie_id: string
    rand1: number
    rand2: number
    sub: string
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
    last_name: string | null
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
    last_name: string | null
    first_name: string | undefined
    age: number | undefined
    name: string | undefined
    doesnt_exist: never | undefined
  }>(r4)
}

function testWhere(db: Kysely<Database>) {
  // Column name
  db.selectFrom('person').where('first_name', '=', 'Arnold')

  // Table and column
  db.selectFrom('person').where('person.age', '=', 25)

  // Schema, table and column
  db.selectFrom('some_schema.movie').where('some_schema.movie.id', '=', '1')

  // Subquery
  db.selectFrom('movie').where(
    (qb) => qb.subQuery('person').select('gender'),
    '=',
    'female'
  )

  // Raw expression
  db.selectFrom('person').where(db.raw('whatever'), '=', 1)
  db.selectFrom('person').where(db.raw('whatever'), '=', true)
  db.selectFrom('person').where(db.raw('whatever'), '=', '1')

  // List value
  db.selectFrom('person').where('gender', 'in', ['female', 'male'])

  // Raw operator
  db.selectFrom('person').where('person.age', db.raw('lol'), 25)

  // Invalid operator
  expectError(db.selectFrom('person').where('person.age', 'lol', 25))

  // Invalid table
  expectError(db.selectFrom('person').where('movie.stars', '=', 25))

  // Invalid column
  expectError(db.selectFrom('person').where('stars', '=', 25))

  // Invalid type for column
  expectError(db.selectFrom('person').where('age', '=', '25'))

  // Invalid type for column
  expectError(db.selectFrom('person').where('gender', '=', 'not_a_gender'))

  // Invalid type for column
  expectError(
    db.selectFrom('person').where('gender', 'in', ['female', 'not_a_gender'])
  )

  // Invalid type for column
  expectError(
    db.selectFrom('some_schema.movie').where('some_schema.movie.id', '=', 1)
  )

  // Invalid type for column
  expectError(
    db
      .selectFrom('some_schema.movie')
      .where(
        (qb) => qb.subQuery('person').select('gender'),
        '=',
        'not_a_gender'
      )
  )
}

async function testJoin(db: Kysely<Database>) {
  const r1 = await db
    .selectFrom('person')
    .innerJoin('movie', 'movie.id', 'person.id')
    .selectAll()
    .execute()

  expectType<(Person & Movie)[]>(r1)

  const r2 = await db
    .selectFrom('person')
    .innerJoin('movie as m', (join) => join.onRef('m.id', '=', 'person.id'))
    .where('m.stars', '>', 2)
    .selectAll('m')
    .execute()

  expectType<Movie[]>(r2)

  const r3 = await db
    .selectFrom('person')
    .innerJoin(
      (qb) =>
        qb
          .subQuery('movie')
          .select(['movie.id', 'movie.stars as rating'])
          .as('m'),
      'm.id',
      'person.id'
    )
    .where('m.rating', '>', 2)
    .selectAll('m')
    .execute()

  expectType<{ id: string; rating: number }[]>(r3)

  const r4 = await db
    .selectFrom('person')
    .innerJoin(
      (qb) => qb.subQuery('movie').selectAll('movie').as('m'),
      (join) => join.onRef('m.id', '=', 'person.id')
    )
    .where('m.stars', '>', 2)
    .selectAll('m')
    .execute()

  expectType<Movie[]>(r4)

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

async function testInsert(db: Kysely<Database>) {
  const person = {
    id: db.generated,
    first_name: 'Jennifer',
    last_name: 'Aniston',
    gender: 'other' as const,
    age: 30,
  }

  const r1 = await db.insertInto('person').values(person).execute()

  expectType<(number | undefined)[]>(r1)

  const r2 = await db.insertInto('person').values(person).executeTakeFirst()

  expectType<number | undefined>(r2)

  // Non-existent column
  expectError(db.insertInto('person').values({ not_column: 'foo' }))

  // Missing required columns
  expectError(db.insertInto('person').values({ first_name: 'Jennifer' }))
}

async function testReturning(db: Kysely<Database>) {
  const person = {
    id: db.generated,
    first_name: 'Jennifer',
    last_name: 'Aniston',
    gender: 'other' as const,
    age: 30,
  }

  // One returning expression
  const r1 = await db
    .insertInto('person')
    .values(person)
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
    .values(person)
    .returning(['id', 'person.first_name as fn'])
    .execute()

  expectType<
    {
      id: number
      fn: string
    }[]
  >(r2)

  // Non-column reference returning expressions
  const r3 = await db
    .insertInto('person')
    .values(person)
    .returning([
      'id',
      db.raw<string>(`concat(first_name, ' ', last_name)`).as('full_name'),
      (qb) => qb.subQuery('pet').select('pet.id').as('sub'),
    ])
    .execute()

  expectType<
    {
      id: number
      full_name: string
      sub: string
    }[]
  >(r3)

  // Non-existent column
  expectError(db.insertInto('person').values(person).returning('not_column'))
}

async function testUpdate(db: Kysely<Database>) {
  const r1 = await db
    .updateTable('pet as p')
    .where('p.id', '=', '1')
    .set({ name: 'Fluffy' })
    .executeTakeFirst()

  expectType<number>(r1)

  // Non-existent column
  expectError(
    db
      .updateTable('pet as p')
      .where('p.id', '=', '1')
      .set({ not_a_column: 'Fluffy' })
  )
}

async function testOrderBy(db: Kysely<Database>) {
  const r1 = await db
    .selectFrom('person')
    .select(['id', 'person.first_name as fn'])
    .orderBy('first_name', 'desc')
    .orderBy('fn')
    .execute()
}

async function testKyselyAndTransactionTypes(db: Kysely<Database>) {
  let trx: Transaction<Database> = {} as unknown as Transaction<Database>

  // Should not be able to assign a Kysely to a Transaction
  expectError((trx = db))

  // Should be able to assign a Transaction to Kysely.
  db = trx
}

async function testWith(db: Kysely<Database>) {
  const r1 = await db
    .with('jennifers', (db) =>
      db.selectFrom('person').where('first_name', '=', 'Jennifer').selectAll()
    )
    .with('female_jennifers', (db) =>
      db
        .selectFrom('jennifers')
        .select('first_name')
        .where('gender', '=', 'female')
        .selectAll('jennifers')
        .select(['first_name as fn', 'last_name as ln'])
    )
    .selectFrom('female_jennifers')
    .select(['fn', 'ln'])
    .execute()

  expectType<
    {
      fn: string
      ln: string | null
    }[]
  >(r1)
}

async function testExecuteTakeFirstOrThrow(db: Kysely<Database>) {
  const r1 = await db
    .selectFrom('person')
    .selectAll()
    .where('id', '=', 1)
    .executeTakeFirstOrThrow()

  expectType<Person>(r1)
}
