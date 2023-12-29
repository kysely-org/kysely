import { Kysely, sql } from '..'
import { Database } from '../shared'
import { expectType, expectError } from 'tsd'

async function testFromSingle(db: Kysely<Database>) {
  // Single table
  const [r1] = await db.selectFrom('person').selectAll().execute()

  expectType<{
    id: number
    first_name: string
    last_name: string | null
    age: number
    gender: 'male' | 'female' | 'other'
    modified_at: Date
    marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
    deleted_at: Date | null
  }>(r1)

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
    .selectFrom((eb) =>
      eb.selectFrom('movie').select('movie.stars as strs').as('m')
    )
    .selectAll('m')
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
    .selectFrom(sql<{ one: 1 }>`(select 1 as one)`.as('o'))
    .select('o.one')
    .execute()
  expectType<{ one: 1 }>(r7)

  // Raw expression factory
  const [r8] = await db
    .selectFrom(() => sql<{ one: 1 }>`(select 1 as one)`.as('o'))
    .select('o.one')
    .execute()
  expectType<{ one: 1 }>(r8)

  // Deeply nested subqueries
  const [r9] = await db
    .selectFrom((eb) =>
      eb
        .selectFrom((eb2) =>
          eb2
            .selectFrom((eb3) =>
              eb3.selectFrom('movie').select('stars as s').as('m1')
            )
            .select('m1.s as s2')
            .as('m2')
        )
        .select('m2.s2 as s3')
        .as('m3')
    )
    .selectAll('m3')
    .execute()
  expectType<{ s3: number }>(r9)

  // Raw expression with raw alias
  const [r10] = await db
    .selectFrom(sql<{ one: 1 }>`(select 1 as one)`.as<'o'>(sql`o(one)`))
    .select('o.one')
    .execute()
  expectType<{ one: 1 }>(r10)

  const [r11] = await db.selectFrom('book').select('id').execute()
  expectType<{ id: number }>(r11)

  // Should not be able to select animal columns from person.
  expectError(db.selectFrom('person').select('pet.id'))

  // Should not be able to start a query against non-existent table.
  expectError(db.selectFrom('doesnt_exists'))

  // Should not be able to start a query against non-existent aliased table.
  expectError(db.selectFrom('doesnt_exists as de'))
}

async function testFromMultiple(db: Kysely<Database>) {
  const [r1] = await db
    .selectFrom([
      'person',
      'pet as a',
      db.selectFrom('movie').select('movie.id as movie_id').as('m'),
      (eb) => eb.selectFrom('book').select('book.name').as('b'),
    ])
    .select([
      'person.first_name',
      'm.movie_id',
      'a.species',
      'b.name as book_name',
    ])
    .execute()
  expectType<{
    first_name: string
    movie_id: string
    species: 'dog' | 'cat'
    book_name: string
  }>(r1)

  // Should not be able to select animal columns from person or movie.
  expectError(db.selectFrom(['person', 'movie']).select('pet.id'))

  // Should not be able to start a query against non-existent table.
  expectError(db.selectFrom(['person', 'doesnt_exists']))
}
