import { expectError, expectType } from 'tsd'
import { ExpressionBuilder, InsertObject, InsertResult, Kysely, sql } from '..'
import { Database } from '../shared'

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
      db.selectFrom('person').select('id').where('person.id', '=', 1),
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
        // `excluded` "table" should take the `UpdateType` of complex columns.
        deleted_at: (eb) => eb.ref('excluded.deleted_at'),
      }),
    )
    .executeTakeFirst()

  expectType<InsertResult>(r5)

  const r6 = await db
    .insertInto('person')
    .values((eb) => ({
      first_name: 'fname',
      age: 10,
      gender: eb.ref('gender'),
    }))
    .executeTakeFirst()

  expectType<InsertResult>(r6)

  // Non-existent table
  expectError(db.insertInto('doesnt_exists'))

  // Non-existent column
  expectError(
    db.insertInto('person').values({ first_name: 'Foo', not_column: 'foo' }),
  )

  // Wrong type for a column
  expectError(
    db
      .insertInto('person')
      .values({ first_name: 10, age: 10, gender: 'other' }),
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
        }),
      ),
  )

  // GeneratedAlways column is not allowed to be inserted
  expectError(db.insertInto('book').values({ id: 1, name: 'foo' }))

  // Wrong subquery return value type
  expectError(
    db.insertInto('person').values({
      first_name: 'what',
      gender: 'male',
      age: (eb) => eb.selectFrom('pet').select('pet.name'),
    }),
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
      sub: string | null
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

async function testOutput(db: Kysely<Database>) {
  const person = {
    first_name: 'Jennifer',
    last_name: 'Aniston',
    gender: 'other' as const,
    age: 30,
  }

  // One returning expression
  const r1 = await db
    .insertInto('person')
    .output('inserted.id')
    .values(person)
    .executeTakeFirst()

  expectType<{ id: number } | undefined>(r1)

  // Multiple returning expressions
  const r2 = await db
    .insertInto('person')
    .output(['inserted.id', 'inserted.first_name as fn'])
    .values(person)
    .execute()

  expectType<{ id: number; fn: string }[]>(r2)

  // Non-column reference returning expressions
  const r3 = await db
    .insertInto('person')
    .output([
      'inserted.id',
      sql<string>`concat(inserted.first_name, ' ', inserted.last_name)`.as(
        'full_name',
      ),
    ])
    .values(person)
    .execute()

  expectType<{ id: number; full_name: string }[]>(r3)

  const r4 = await db
    .insertInto('movie')
    .outputAll('inserted')
    .values({ stars: 5 })
    .executeTakeFirstOrThrow()

  expectType<{ id: string; stars: number }>(r4)

  // Non-existent column
  expectError(
    db.insertInto('person').output('inserted.not_column').values(person),
  )

  // Without prefix
  expectError(db.insertInto('person').output('age').values(person))
  expectError(db.insertInto('person').outputAll().values(person))

  // Non-existent prefix
  expectError(db.insertInto('person').output('foo.age').values(person))
  expectError(db.insertInto('person').outputAll('foo').values(person))

  // Wrong prefix
  expectError(db.insertInto('person').output('deleted.age').values(person))
  expectError(db.insertInto('person').outputAll('deleted').values(person))
}

async function testjval(db: Kysely<Database>) {
  const getValues = <
    O extends Partial<InsertObject<Database, 'person_metadata'>>,
  >(
    { jval }: ExpressionBuilder<Database, 'person_metadata'>,
    overrides?: O,
  ) => ({
    array: jval(['123']),
    experience: jval([{ establishment: 'New York Times' }]),
    nicknames: jval(['Jenny']),
    person_id: 1,
    profile: jval({
      auth: {
        roles: ['admin'],
      },
      tags: ['important'],
    }),
    website: jval({ url: 'http://example.com' }),
    record: jval({ key: 'value' }),
    schedule: jval([
      [
        [
          {
            name: 'foo',
            time: '2024-01-01T00:00:00.000Z',
          },
        ],
      ],
    ]),
    ...overrides,
  })

  db.insertInto('person_metadata').values(getValues).execute()

  db.insertInto('person_metadata').values((eb) =>
    getValues(eb, {
      array: null,
    }),
  )

  db.insertInto('person_metadata').values((eb) =>
    getValues(eb, {
      array: eb.jval(null),
    }),
  )

  db.insertInto('person_metadata').values((eb) =>
    getValues(eb, {
      array: sql.jval(null),
    }),
  )

  db.insertInto('person_metadata').values((eb) =>
    getValues(eb, {
      website: sql.jval({ url: 'http://example.com' }),
    }),
  )

  expectError(
    db.insertInto('person_metadata').values((eb) =>
      getValues(eb, {
        array: ['123'], // expects `jval(Array<string> | null)`
      }),
    ),
  )

  expectError(
    db.insertInto('person_metadata').values((eb) =>
      getValues(eb, {
        array: eb.val(['123']), // expects `jval(Array<string> | null)`
      }),
    ),
  )

  expectError(
    db.insertInto('person_metadata').values((eb) =>
      getValues(eb, {
        array: eb.jval({}), // expects `jval(Array<string> | null)`
      }),
    ),
  )

  expectError(
    db.insertInto('person_metadata').values((eb) =>
      getValues(eb, {
        array: eb.jval([123]), // expects `jval(Array<string> | null)`
      }),
    ),
  )

  expectError(
    db.insertInto('person_metadata').values((eb) =>
      getValues(eb, {
        experience: [{ establishment: 'New York Times' }], // expects `jval({ establishment: string }[])`
      }),
    ),
  )

  expectError(
    db.insertInto('person_metadata').values((eb) =>
      getValues(eb, {
        experience: eb.jval({ establishment: 'New York Times' }), // expects `jval({ establishment: string }[])`
      }),
    ),
  )

  expectError(
    db.insertInto('person_metadata').values((eb) =>
      getValues(eb, {
        experience: eb.jval([{}]), // expects `jval({ establishment: string }[])`
      }),
    ),
  )

  expectError(
    db.insertInto('person_metadata').values((eb) =>
      getValues(eb, {
        experience: eb.jval([{ establishment: 2 }]), // expects `jval({ establishment: string }[])`
      }),
    ),
  )
}
