import { Kysely } from '..'
import { Database } from '../shared'
import { expectType, expectError } from 'tsd'

async function testAssertType(db: Kysely<Database>) {
  const r1 = await db
    .selectFrom('person')
    .select('first_name as fn')
    .$assertType<{ fn: string }>()
    .executeTakeFirstOrThrow()

  expectType<{ fn: string }>(r1)

  const r2 = await db
    .updateTable('person')
    .returning('first_name as fn')
    .$assertType<{ fn: string }>()
    .executeTakeFirstOrThrow()

  expectType<{ fn: string }>(r2)

  const r3 = await db
    .insertInto('person')
    .values({ first_name: 'foo', age: 54, gender: 'other' })
    .returning('first_name as fn')
    .$assertType<{ fn: string }>()
    .executeTakeFirstOrThrow()

  expectType<{ fn: string }>(r3)

  const r4 = await db
    .deleteFrom('person')
    .returning('first_name as fn')
    .$assertType<{ fn: string }>()
    .executeTakeFirstOrThrow()

  expectType<{ fn: string }>(r4)

  expectError(
    db
      .selectFrom('person')
      .select('first_name as fn')
      .$assertType<{ wrong: string }>()
      .execute()
  )

  expectError(
    db
      .selectFrom('person')
      .select('first_name as fn')
      .$assertType<{ fn: string; extra: number }>()
      .execute()
  )
}
