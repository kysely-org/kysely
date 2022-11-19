import { expectType, expectError } from 'tsd'
import { Kysely, InsertResult, sql } from '..'
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

  const dinosaurs = ['T-Rex']

  // Non-existent column (values single)
  expectError(
    db.insertInto('person').values({
      dinosaurs,
      first_name: 'John',
      age: 5,
      gender: 'female',
    })
  )

  // Non-existent column wrapped in spreaded object (values single)
  expectError(
    db.insertInto('person').values({
      ...(dinosaurs != null && { dinosaurs }),
      first_name: 'John',
      age: 5,
      gender: 'female',
    })
  )

  db.insertInto('person').values([
    {
      first_name: 'John',
      age: 5,
      gender: 'female',
    },
    {
      first_name: 'Jennifer',
      age: 15,
      gender: 'male',
    },
  ])

  // Non-existent column (values multi)
  expectError(
    db.insertInto('person').values([
      {
        first_name: 'John',
        age: 5,
        gender: 'female',
      },
      {
        first_name: 'Jennifer',
        age: 15,
        dinosaurs,
        gender: 'male',
      },
    ])
  )

  // Non-existent column wrapped in spreaded object (values multi)
  expectError(
    db.insertInto('person').values([
      {
        first_name: 'John',
        age: 5,
        gender: 'female',
      },
      {
        first_name: 'Jennifer',
        age: 15,
        ...(dinosaurs != null && { dinosaurs }),
        gender: 'male',
      },
    ])
  )

  // values empty array
  expectError(db.insertInto('person').values([]))

  // Non-existent column (onDuplicateKeyUpdate)
  expectError(
    db
      .insertInto('person')
      .values({
        first_name: 'John',
        age: 5,
        gender: 'female',
      })
      .onDuplicateKeyUpdate({
        first_name: 'John',
        dinosaurs,
        age: 5,
        gender: 'female',
      })
  )

  // Non-existent column wrapped in spreaded object (onDuplicateKeyUpdate)
  expectError(
    db
      .insertInto('person')
      .values({
        first_name: 'John',
        age: 5,
        gender: 'female',
      })
      .onDuplicateKeyUpdate({
        first_name: 'John',
        ...(dinosaurs != null && { dinosaurs }),
        age: 5,
        gender: 'female',
      })
  )

  // Non-existent column (onConflict.doUpdateSet)
  expectError(
    db
      .insertInto('person')
      .values({
        first_name: 'John',
        age: 5,
        gender: 'female',
      })
      .onConflict((ocb) =>
        ocb.doUpdateSet({
          first_name: 'John',
          dinosaurs,
          age: 5,
          gender: 'female',
        })
      )
  )

  // Non-existent column wrapped in spreaded object (onConflict.doUpdateSet)
  expectError(
    db
      .insertInto('person')
      .values({
        first_name: 'John',
        age: 5,
        gender: 'female',
      })
      .onConflict((ocb) =>
        ocb.doUpdateSet({
          first_name: 'John',
          ...(dinosaurs != null && { dinosaurs }),
          age: 5,
          gender: 'female',
        })
      )
  )
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