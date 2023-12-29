/**
 * The type tests in this file can be run using `tsd`. Even though the unit
 * and integration tests should test most of the typings as well, this file is
 * needed to test some tricky typings that, if broken, don't necessarily show
 * up in the unit or integration tests. For example if the typings are broken
 * in a way that produces `any` types, the unit and integration tests are
 * happy, but we can catch it here.
 */

import { Kysely, Transaction, InsertResult, UpdateResult, Selectable } from '..'

import { Database, Person } from '../shared'
import { expectType, expectError } from 'tsd'

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
    .$call((qb) => qb.select('name'))
    .execute()

  expectType<{ species: 'dog' | 'cat'; name: string }>(r1)
}

async function testUntypedKysely(db: Kysely<any>) {
  // Kysely instance with `any` DB type still extracts column names.
  const r1 = await db
    .selectFrom('foo')
    .select(['spam', 'bar as baz'])
    .executeTakeFirstOrThrow()

  expectType<{ spam: any; baz: any }>(r1)
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
