/**
 * The type tests in this file can be run using `tsd`. Even though the unit
 * and integration tests should test most of the typings as well, this file is
 * needed to test some tricky typings that, if broken, don't necessarily show
 * up in the unit or integration tests. For example if the typings are broken
 * in a way that produces `any` types, the unit and integration tests are
 * happy, but we can catch it here.
 */

import {
  Kysely,
  Transaction,
  InsertResult,
  UpdateResult,
  DeleteResult,
  Selectable,
  sql,
  ExpressionBuilder,
} from '..'

import { Database, Person, Pet } from '../shared'

import { expectType, expectError, expectAssignable } from 'tsd'

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

  // Should not be able to select animal columns from person.
  expectError(db.selectFrom('person').select('pet.id'))

  // Should not be able to start a query against non-existent table.
  expectError(db.selectFrom('doesnt_exists'))

  // Should not be able to start a query against non-existent aliased table.
  expectError(db.selectFrom('doesnt_exists as de'))

  const [r11] = await db.selectFrom('book').select('id').execute()
  expectType<{ id: number }>(r11)
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
    .select(sql<boolean>`random() > 0.5`.as('rando'))
    .execute()

  expectType<{ rando: boolean }>(r4)

  // Raw selection with a dynamic alias.
  const alias = 'col_' + Math.round(Math.random() * 1000)
  const [r5] = await qb
    .select(sql`random() > 0.5`.as(alias))
    .select('first_name')
    .execute()
  expectType<{ first_name: string } & { [key: string]: unknown }>(r5)

  // Subquery
  const [r6] = await qb
    .select(db.selectFrom('movie').select('id').as('movie_id'))
    .execute()
  expectType<{ movie_id: string }>(r6)

  // Subquery factory
  const [r7] = await qb
    .select((qb) =>
      qb
        .selectFrom('movie')
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

  // FunctionModule call
  const [r12] = await qb
    .select(db.fn.max('first_name').as('max_first_name'))
    .execute()
  expectType<{ max_first_name: string }>(r12)

  // FunctionModule call through expression builder
  const [r13] = await qb
    .select((qb) => qb.fn.max('first_name').as('max_first_name'))
    .execute()
  expectType<{ max_first_name: string }>(r13)

  // FunctionModule count call
  const { count } = db.fn
  const r14 = await qb
    .select(count<number>('id').as('count'))
    .executeTakeFirstOrThrow()
  expectType<{ count: number }>(r14)

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
          .selectFrom('movie')
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
      sql<number>`random()`.as('rand1'),
      sql<number>`random()`.as('rand2'),
      (qb) => qb.selectFrom('pet').select('pet.id').as('sub'),
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

  // Subquery in LHS
  db.selectFrom('movie').where(
    (qb) => qb.selectFrom('person').select('gender'),
    '=',
    'female'
  )

  // Subquery in RHS
  db.selectFrom('movie').where(sql`${'female'}`, '=', (qb) =>
    qb.selectFrom('person').select('gender')
  )

  // Raw expression
  db.selectFrom('person').where('first_name', '=', sql`'foo'`)
  db.selectFrom('person').where('first_name', '=', sql<string>`'foo'`)
  db.selectFrom('person').where(sql`whatever`, '=', 1)
  db.selectFrom('person').where(sql`whatever`, '=', true)
  db.selectFrom('person').where(sql`whatever`, '=', '1')

  // List value
  db.selectFrom('person').where('gender', 'in', ['female', 'male'])

  // Raw operator
  db.selectFrom('person').where('person.age', sql`lol`, 25)

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
        (qb) => qb.selectFrom('person').select('gender'),
        '=',
        'not_a_gender'
      )
  )

  // Invalid type for column
  expectError(db.selectFrom('person').where('first_name', '=', sql<number>`1`))

  // Invalid type for column
  expectError(db.selectFrom('person').where(sql<string>`first_name`, '=', 1))
}

async function testConditionalJoinWhere(db: Kysely<Database>) {
  let qb = db.selectFrom('person')
  let petName: string | undefined = 'catto'
  let petSpecies: 'cat' | 'dog' | undefined = 'cat'

  if (petName || petSpecies) {
    let qb2 = qb.innerJoin('pet', 'person.id', 'pet.owner_id')

    if (petName) {
      qb2 = qb2.where('pet.name', '=', petName)
    }

    if (petSpecies) {
      qb2 = qb2.where('pet.species', '=', petSpecies)
    }

    // This is the actual test. The query builder with `pet`
    // table joined should still be assignable to the original
    // query builder.
    qb = qb2
  }

  const res = await qb.selectAll('person').execute()
}

async function testJoin(db: Kysely<Database>) {
  // Simple join with two columns
  const r1 = await db
    .selectFrom('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .selectAll()
    .execute()

  expectType<
    {
      id: number | string
      first_name: string
      last_name: string | null
      age: number
      gender: 'male' | 'female' | 'other'
      modified_at: Date

      name: string
      species: 'cat' | 'dog'
      owner_id: number
    }[]
  >(r1)

  // Join with an alias using the join builder instead of two columns
  const r2 = await db
    .selectFrom('person')
    .innerJoin('pet as p', (join) => join.onRef('p.owner_id', '=', 'person.id'))
    .where('p.species', 'in', ['cat'])
    .selectAll('p')
    .execute()

  expectType<Selectable<Pet>[]>(r2)
  expectType<
    { id: string; name: string; species: 'cat' | 'dog'; owner_id: number }[]
  >(r2)

  // Join subquery
  const r3 = await db
    .selectFrom('person')
    .innerJoin(
      db.selectFrom('pet').select(['pet.id', 'pet.owner_id as owner']).as('p'),
      'p.owner',
      'person.id'
    )
    .where('p.owner', '>', 2)
    .selectAll('p')
    .execute()

  expectType<{ id: string; owner: number }[]>(r3)

  // Join subquery using join builder
  const r4 = await db
    .selectFrom('person')
    .innerJoin(
      (qb) => qb.selectFrom('pet').selectAll('pet').as('p'),
      (join) => join.onRef('p.owner_id', '=', 'person.id')
    )
    .where('p.owner_id', '>', 2)
    .selectAll('p')
    .execute()

  expectType<Selectable<Pet>[]>(r4)

  // Two left joins
  const r5 = await db
    .selectFrom('person')
    .leftJoin('pet', 'pet.owner_id', 'person.id')
    .leftJoin('movie', 'movie.id', 'person.id')
    .selectAll()
    .executeTakeFirstOrThrow()

  expectType<{
    id: number | string | null
    first_name: string
    last_name: string | null
    age: number
    gender: 'male' | 'female' | 'other'
    modified_at: Date

    // All Pet columns should be nullable because of the left join
    name: string | null
    species: 'dog' | 'cat' | null
    owner_id: number | null

    // All Movie columns should be nullable because of the left join
    stars: number | null
  }>(r5)

  // Two right joins
  const r6 = await db
    .selectFrom('person')
    .rightJoin('pet', 'pet.owner_id', 'person.id')
    .rightJoin('movie', 'movie.id', 'person.id')
    .selectAll()
    .executeTakeFirstOrThrow()

  expectType<{
    // All Person columns should be nullable because of the right join.
    id: number | string | null
    first_name: string | null
    last_name: string | null
    age: number | null
    gender: 'male' | 'female' | 'other' | null
    modified_at: Date | null

    // All Pet columns should also be nullable because there's another
    // right join after the Pet join.
    name: string | null
    species: 'dog' | 'cat' | null
    owner_id: number | null

    // Movie columns should not be nullable because it's the last
    // right joined table.
    stars: number
  }>(r6)

  // Two full joins.
  const r7 = await db
    .selectFrom('person')
    .fullJoin('pet', 'pet.owner_id', 'person.id')
    .fullJoin('movie', 'movie.id', 'person.id')
    .selectAll()
    .executeTakeFirstOrThrow()

  // All columns should be nullable because of the full join
  expectType<{
    id: number | string | null
    first_name: string | null
    last_name: string | null
    age: number | null
    gender: 'male' | 'female' | 'other' | null
    modified_at: Date | null

    name: string | null
    species: 'dog' | 'cat' | null
    owner_id: number | null

    stars: number | null
  }>(r7)

  // Update query with a join
  const r8 = await db
    .updateTable('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .set({ last_name: 'Jennifer' })
    .where('pet.id', '=', '1')

  // Refer to table that's not joined
  expectError(
    db.selectFrom('person').innerJoin('movie', 'movie.id', 'pet.owner_id')
  )

  // Refer to column that doesn't exist
  expectError(db.selectFrom('person').innerJoin('movie', 'foo', 'person.id'))

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
    first_name: 'Jennifer',
    last_name: 'Aniston',
    gender: 'other' as const,
    age: 30,
  }

  // Insert one row
  const r1 = await db.insertInto('person').values(person).execute()

  expectType<InsertResult[]>(r1)

  // Should be able to leave out nullable columns like last_name
  const r2 = await db
    .insertInto('person')
    .values({ first_name: 'fname', age: 10, gender: 'other' })
    .executeTakeFirst()

  expectType<InsertResult>(r2)

  // The result type is correct when executeTakeFirstOrThrow is used
  const r3 = await db
    .insertInto('person')
    .values(person)
    .executeTakeFirstOrThrow()

  expectType<InsertResult>(r3)

  // Insert values from a CTE
  const r4 = await db
    .with('foo', (db) =>
      db.selectFrom('person').select('id').where('person.id', '=', 1)
    )
    .insertInto('movie')
    .values({
      stars: (eb) => eb.selectFrom('foo').select('foo.id'),
    })
    .executeTakeFirst()

  expectType<InsertResult>(r4)

  // Insert with an on conflict statement
  const r5 = await db
    .insertInto('person')
    .values(person)
    .onConflict((oc) =>
      oc.column('id').doUpdateSet({
        // Should be able to reference the `excluded` "table"
        first_name: (eb) => eb.ref('excluded.first_name'),
        last_name: (eb) => eb.ref('last_name'),
      })
    )
    .executeTakeFirst()

  expectType<InsertResult>(r5)

  // Non-existent table
  expectError(db.insertInto('doesnt_exists'))

  // Non-existent column
  expectError(db.insertInto('person').values({ not_column: 'foo' }))

  // Wrong type for a column
  expectError(
    db.insertInto('person').values({ first_name: 10, age: 10, gender: 'other' })
  )

  // Missing required columns
  expectError(db.insertInto('person').values({ first_name: 'Jennifer' }))

  // Explicitly excluded column
  expectError(db.insertInto('person').values({ modified_at: new Date() }))

  // Non-existent column in a `doUpdateSet` call.
  expectError(
    db
      .insertInto('person')
      .values(person)
      .onConflict((oc) =>
        oc.column('id').doUpdateSet({
          first_name: (eb) => eb.ref('doesnt_exist'),
        })
      )
  )

  // GeneratedAlways column is not allowed to be inserted
  expectError(db.insertInto('book').values({ id: 1, name: 'foo' }))

  // Wrong subquery return value type
  expectError(
    db.insertInto('person').values({
      first_name: 'what',
      gender: 'male',
      age: (eb) => eb.selectFrom('pet').select('pet.name'),
    })
  )

  // Nullable column as undefined
  const insertObject: {
    first_name: string
    last_name: string | undefined
    age: number
    gender: 'male' | 'female' | 'other'
  } = {
    first_name: 'emily',
    last_name: 'smith',
    age: 25,
    gender: 'female',
  }

  db.insertInto('person').values(insertObject)
}

async function testReturning(db: Kysely<Database>) {
  const person = {
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
      sql<string>`concat(first_name, ' ', last_name)`.as('full_name'),
      (qb) => qb.selectFrom('pet').select('pet.id').as('sub'),
    ])
    .execute()

  expectType<
    {
      id: number
      full_name: string
      sub: string
    }[]
  >(r3)

  const r4 = await db
    .insertInto('movie')
    .values({ stars: 5 })
    .returningAll()
    .executeTakeFirstOrThrow()

  expectType<{
    id: string
    stars: number
  }>(r4)

  // Non-existent column
  expectError(db.insertInto('person').values(person).returning('not_column'))
}

async function testUpdate(db: Kysely<Database>) {
  const r1 = await db
    .updateTable('pet as p')
    .where('p.id', '=', '1')
    .set({ name: 'Fluffy' })
    .executeTakeFirst()

  expectType<UpdateResult>(r1)

  // Non-existent column
  expectError(
    db
      .updateTable('pet as p')
      .where('p.id', '=', '1')
      .set({ not_a_column: 'Fluffy' })
  )

  // GeneratedAlways column is not allowed to be updated
  expectError(db.updateTable('book').set({ id: 1, name: 'foo' }))

  db.updateTable('book').set({ name: 'bar' })

  // Nullable column as undefined
  const mutationObject: { last_name: string | undefined } = {
    last_name: 'smith',
  }

  db.updateTable('person').set(mutationObject)
}

async function testDelete(db: Kysely<Database>) {
  const r1 = await db.deleteFrom('pet').where('id', '=', '1').executeTakeFirst()
  expectType<DeleteResult>(r1)
}

async function testOrderBy(db: Kysely<Database>) {
  const r1 = await db
    .selectFrom('person')
    .select(['id', 'person.first_name as fn'])
    .orderBy('first_name', 'desc')
    // Should be able to reference selections.
    .orderBy('fn')
    .execute()
}

async function testKyselyAndTransactionTypes(db: Kysely<Database>) {
  let trx: Transaction<Database> = {} as unknown as Transaction<Database>

  // Should not be able to assign a Kysely to a Transaction
  expectError((trx = db))

  // Should be able to assign a Transaction to Kysely
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

  const r2 = await db
    .with('jennifers(first_name, ln, gender)', (db) =>
      db
        .selectFrom('person')
        .where('first_name', '=', 'Jennifer')
        .select(['first_name', 'last_name as ln', 'gender'])
    )
    .selectFrom('jennifers')
    .select(['first_name', 'ln'])
    .execute()

  expectType<
    {
      first_name: string
      ln: string | null
    }[]
  >(r2)

  const r3 = await db
    .withRecursive('jennifers(first_name, ln)', (db) =>
      db
        .selectFrom('person')
        .where('first_name', '=', 'Jennifer')
        .select(['first_name', 'last_name as ln'])
        // Recursive CTE can refer to itself.
        .union(db.selectFrom('jennifers').select(['first_name', 'ln']))
    )
    .selectFrom('jennifers')
    .select(['first_name', 'ln'])
    .execute()

  expectType<
    {
      first_name: string
      ln: string | null
    }[]
  >(r3)

  // Different columns in expression and CTE name.
  expectError(
    db
      .with('jennifers(first_name, last_name, gender)', (db) =>
        db
          .selectFrom('person')
          .where('first_name', '=', 'Jennifer')
          .select(['first_name', 'last_name'])
      )
      .selectFrom('jennifers')
      .select(['first_name', 'last_name'])
  )
}

async function testExecuteTakeFirstOrThrow(db: Kysely<Database>) {
  const r1 = await db
    .selectFrom('person')
    .selectAll()
    .where('id', '=', 1)
    .executeTakeFirstOrThrow()

  expectType<Selectable<Person>>(r1)
}

async function testCall(db: Kysely<Database>) {
  // Table with alias
  const [r1] = await db
    .selectFrom('pet as p')
    .select('p.species')
    .call((qb) => qb.select('name'))
    .execute()

  expectType<{ species: 'dog' | 'cat' } & { name: string }>(r1)
}

async function testIf(db: Kysely<Database>) {
  const condition = Math.random() < 0.5

  // Conditional select
  const [r1] = await db
    .selectFrom('pet as p')
    .select('p.species')
    .if(condition, (qb) => qb.select('name'))
    .execute()

  expectType<{ species: 'dog' | 'cat' } & { name?: string }>(r1)

  // Conditional returning in delete
  const [r2] = await db
    .deleteFrom('person')
    .if(condition, (qb) => qb.returning('first_name'))
    .execute()

  expectType<{ first_name?: string }>(r2)

  // Conditional additional returning in delete
  const [r3] = await db
    .deleteFrom('person')
    .returning('first_name')
    .if(condition, (qb) => qb.returning('last_name'))
    .execute()

  expectType<{ first_name: string } & { last_name?: string | null }>(r3)

  // Conditional where in delete
  const [r4] = await db
    .deleteFrom('person')
    .if(condition, (qb) => qb.where('id', '=', 1))
    .execute()

  expectType<DeleteResult>(r4)

  // Conditional where after returning in delete
  const [r5] = await db
    .deleteFrom('person')
    .returning('first_name')
    .if(condition, (qb) => qb.where('id', '=', 1))
    .execute()

  expectType<{ first_name: string } & Partial<{}>>(r5)

  // Conditional returning in update
  const [r6] = await db
    .updateTable('person')
    .set({ last_name: 'Foo' })
    .if(condition, (qb) => qb.returning('first_name'))
    .execute()

  expectType<{ first_name?: string }>(r6)

  // Conditional additional returning in update
  const [r7] = await db
    .updateTable('person')
    .set({ last_name: 'Foo' })
    .returning('first_name')
    .if(condition, (qb) => qb.returning('last_name'))
    .execute()

  expectType<{ first_name: string } & { last_name?: string | null }>(r7)

  // Conditional where in update
  const [r8] = await db
    .updateTable('person')
    .set({ last_name: 'Foo' })
    .if(condition, (qb) => qb.where('id', '=', 1))
    .execute()

  expectType<UpdateResult>(r8)

  // Conditional where after returning in update
  const [r9] = await db
    .updateTable('person')
    .set({ last_name: 'Foo' })
    .returning('first_name')
    .if(condition, (qb) => qb.where('id', '=', 1))
    .execute()

  expectType<{ first_name: string } & Partial<{}>>(r9)

  // Conditional returning in insert
  const [r10] = await db
    .insertInto('person')
    .values({ first_name: 'Foo', last_name: 'Bar', gender: 'other', age: 0 })
    .if(condition, (qb) => qb.returning('first_name'))
    .execute()

  expectType<{ first_name?: string }>(r10)

  // Conditional additional returning in insert
  const [r11] = await db
    .insertInto('person')
    .values({ first_name: 'Foo', last_name: 'Bar', gender: 'other', age: 0 })
    .returning('first_name')
    .if(condition, (qb) => qb.returning('last_name'))
    .execute()

  expectType<{ first_name: string } & { last_name?: string | null }>(r11)

  // Conditional ingore in insert
  const [r12] = await db
    .insertInto('person')
    .values({ first_name: 'Foo', last_name: 'Bar', gender: 'other', age: 0 })
    .if(condition, (qb) => qb.ignore())
    .execute()

  expectType<InsertResult>(r12)

  // Conditional ignore after returning in insert
  const [r13] = await db
    .insertInto('person')
    .values({ first_name: 'Foo', last_name: 'Bar', gender: 'other', age: 0 })
    .returning('first_name')
    .if(condition, (qb) => qb.ignore())
    .execute()

  expectType<{ first_name: string } & Partial<{}>>(r13)
}

async function testGenericSelect<T extends keyof Database>(
  db: Kysely<Database>,
  table: T
) {
  const r1 = await db.selectFrom(table).select('id').executeTakeFirstOrThrow()
  expectAssignable<string | number>(r1.id)
}

async function testGenericUpdate(db: Kysely<Database>, table: 'pet' | 'movie') {
  await db.updateTable(table).set({ id: '123' }).execute()
}

async function testSelectsInVariable(db: Kysely<Database>) {
  const selects = [
    'first_name',
    (eb: ExpressionBuilder<Database, 'person'>) =>
      eb
        .selectFrom('pet')
        .select('name')
        .whereRef('pet.owner_id', '=', 'person.id')
        .as('pet_name'),
  ] as const

  const r1 = await db
    .selectFrom('person')
    .select(selects)
    .executeTakeFirstOrThrow()

  expectType<{ first_name: string; pet_name: string }>(r1)
}

async function testUntypedKysely(db: Kysely<any>) {
  // Kysely instance with `any` DB type still extracts column names.
  const r1 = await db
    .selectFrom('foo')
    .select(['spam', 'bar as baz'])
    .executeTakeFirstOrThrow()

  expectType<{ spam: any; baz: any }>(r1)
}

async function testManyJoins(db: Kysely<Database>) {
  // Make sure things still work if we add a huge amount of joins.
  const r1 = await db
    .selectFrom('person')
    .innerJoin('pet as p1', 'p1.owner_id', 'person.id')
    .innerJoin('pet as p2', 'p2.owner_id', 'person.id')
    .innerJoin('pet as p3', 'p3.owner_id', 'person.id')
    .innerJoin('pet as p4', 'p4.owner_id', 'person.id')
    .innerJoin('pet as p5', 'p5.owner_id', 'person.id')
    .innerJoin('pet as p6', 'p6.owner_id', 'person.id')
    .innerJoin('pet as p7', 'p7.owner_id', 'person.id')
    .innerJoin('pet as p8', 'p8.owner_id', 'person.id')
    .innerJoin('pet as p9', 'p9.owner_id', 'person.id')
    .innerJoin('pet as p10', 'p10.owner_id', 'person.id')
    .innerJoin('pet as p11', 'p11.owner_id', 'person.id')
    .innerJoin('pet as p12', 'p12.owner_id', 'person.id')
    .innerJoin('pet as p13', 'p13.owner_id', 'person.id')
    .innerJoin('pet as p14', 'p14.owner_id', 'person.id')
    .innerJoin('pet as p15', 'p15.owner_id', 'person.id')
    .innerJoin('pet as p16', 'p16.owner_id', 'person.id')
    .innerJoin('pet as p17', 'p17.owner_id', 'person.id')
    .innerJoin('pet as p18', 'p18.owner_id', 'person.id')
    .innerJoin('pet as p19', 'p19.owner_id', 'person.id')
    .innerJoin('pet as p20', 'p20.owner_id', 'person.id')
    .select(['age', 'last_name'])
    .executeTakeFirstOrThrow()

  expectType<{ age: number; last_name: string | null }>(r1)

  const r2 = await db
    .selectFrom('person')
    .rightJoin('pet as p1', 'p1.owner_id', 'person.id')
    .rightJoin('pet as p2', 'p2.owner_id', 'person.id')
    .rightJoin('pet as p3', 'p3.owner_id', 'person.id')
    .rightJoin('pet as p4', 'p4.owner_id', 'person.id')
    .rightJoin('pet as p5', 'p5.owner_id', 'person.id')
    .rightJoin('pet as p6', 'p6.owner_id', 'person.id')
    .rightJoin('pet as p7', 'p7.owner_id', 'person.id')
    .rightJoin('pet as p8', 'p8.owner_id', 'person.id')
    .rightJoin('pet as p9', 'p9.owner_id', 'person.id')
    .rightJoin('pet as p10', 'p10.owner_id', 'person.id')
    .rightJoin('pet as p11', 'p11.owner_id', 'person.id')
    .rightJoin('pet as p12', 'p12.owner_id', 'person.id')
    .select(['age', 'last_name'])
    .executeTakeFirstOrThrow()

  expectType<{ age: number | null; last_name: string | null }>(r2)

  const r3 = await db
    .selectFrom('person')
    .leftJoin('pet as p1', (join) =>
      join.onRef('p1.owner_id', '=', 'person.id')
    )
    .leftJoin('pet as p2', (join) =>
      join.onRef('p2.owner_id', '=', 'person.id')
    )
    .leftJoin('pet as p3', (join) =>
      join.onRef('p3.owner_id', '=', 'person.id')
    )
    .leftJoin('pet as p4', (join) =>
      join.onRef('p4.owner_id', '=', 'person.id')
    )
    .leftJoin('pet as p5', (join) =>
      join.onRef('p5.owner_id', '=', 'person.id')
    )
    .leftJoin('pet as p6', (join) =>
      join.onRef('p6.owner_id', '=', 'person.id')
    )
    .leftJoin('pet as p7', (join) =>
      join.onRef('p7.owner_id', '=', 'person.id')
    )
    .leftJoin('pet as p8', (join) =>
      join.onRef('p8.owner_id', '=', 'person.id')
    )
    .leftJoin('pet as p9', (join) =>
      join.onRef('p9.owner_id', '=', 'person.id')
    )
    .leftJoin('pet as p10', (join) =>
      join.onRef('p10.owner_id', '=', 'person.id')
    )
    .leftJoin('pet as p11', (join) =>
      join.onRef('p11.owner_id', '=', 'person.id')
    )
    .leftJoin('pet as p12', (join) =>
      join.onRef('p12.owner_id', '=', 'person.id')
    )
    .leftJoin('pet as p13', (join) =>
      join.onRef('p13.owner_id', '=', 'person.id')
    )
    .leftJoin('pet as p14', (join) =>
      join.onRef('p14.owner_id', '=', 'person.id')
    )
    .leftJoin('pet as p15', (join) =>
      join.onRef('p15.owner_id', '=', 'person.id')
    )
    .leftJoin('pet as p16', (join) =>
      join.onRef('p16.owner_id', '=', 'person.id')
    )
    .leftJoin('pet as p17', (join) =>
      join.onRef('p17.owner_id', '=', 'person.id')
    )
    .leftJoin('pet as p18', (join) =>
      join.onRef('p18.owner_id', '=', 'person.id')
    )
    .leftJoin('pet as p19', (join) =>
      join.onRef('p19.owner_id', '=', 'person.id')
    )
    .leftJoin('pet as p20', (join) =>
      join.onRef('p20.owner_id', '=', 'person.id')
    )
    .select(['age', 'last_name'])
    .executeTakeFirstOrThrow()

  expectType<{ age: number; last_name: string | null }>(r3)
}

async function testReplace(db: Kysely<Database>) {
  const person = {
    id: 10,
    first_name: 'Jennifer',
    last_name: 'Aniston',
    gender: 'other' as const,
    age: 30,
  }

  const r1 = await db.replaceInto('person').values(person).execute()

  expectType<InsertResult[]>(r1)

  const r2 = await db
    .replaceInto('person')
    .values({ id: 11, first_name: 'fname', age: 10, gender: 'other' })
    .executeTakeFirst()

  expectType<InsertResult>(r2)

  const r3 = await db
    .replaceInto('person')
    .values(person)
    .executeTakeFirstOrThrow()

  expectType<InsertResult>(r3)

  const r4 = await db
    .with('foo', (db) =>
      db.selectFrom('person').select('id').where('person.id', '=', 1)
    )
    .replaceInto('movie')
    .values({
      id: '123',
      stars: (eb) => eb.selectFrom('foo').select('foo.id'),
    })
    .executeTakeFirst()

  expectType<InsertResult>(r4)

  // Non-existent table
  expectError(db.replaceInto('doesnt_exists'))

  // Non-existent column
  expectError(db.replaceInto('person').values({ not_column: 'foo' }))

  // Wrong type for a column
  expectError(
    db
      .replaceInto('person')
      .values({ first_name: 10, age: 10, gender: 'other' })
  )

  // Missing required columns
  expectError(
    db.replaceInto('person').values({ age: 5, first_name: 'Jennifer' })
  )

  // Explicitly excluded column
  expectError(db.replaceInto('person').values({ modified_at: new Date() }))

  // GeneratedAlways column is not allowed to be inserted/replaced
  expectError(db.replaceInto('book').values({ id: 1, name: 'foo' }))

  db.replaceInto('book').values({ name: 'bar' })
}
