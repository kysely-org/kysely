import { Kysely } from '..'
import { Database } from '../shared'
import { expectType } from 'tsd'

async function testClearSelect(db: Kysely<Database>) {
  const r1 = await db
    .selectFrom('person')
    .select(['first_name', 'gender'])
    .clearSelect()
    .select('id')
    .executeTakeFirstOrThrow()

  expectType<{ id: number }>(r1)

  const r2 = await db
    .selectFrom('person')
    .selectAll()
    .clearSelect()
    .select('age')
    .executeTakeFirstOrThrow()

  expectType<{ age: number }>(r2)
}

async function testClearInsert(db: Kysely<Database>) {
  const r1 = await db
    .insertInto('person')
    .values({ first_name: 'Bruce', last_name: 'Willis', age: 68, gender: 'male' })
    .returning(['first_name', 'gender'])
    .clearReturning()
    .returning('id')
    .executeTakeFirstOrThrow()

  expectType<{ id: number }>(r1)

  const r2 = await db
    .insertInto('person')
    .values({ first_name: 'Bruce', last_name: 'Willis', age: 68, gender: 'male' })
    .returningAll()
    .clearReturning()
    .returning('age')
    .executeTakeFirstOrThrow()

  expectType<{ age: number }>(r2)
}

async function testClearUpdate(db: Kysely<Database>) {
  const r1 = await db
    .updateTable('person')
    .set({ age: 76 })
    .where('first_name', '=', 'Arnold')
    .returning(['first_name', 'gender'])
    .clearReturning()
    .returning('id')
    .executeTakeFirstOrThrow()

  expectType<{ id: number }>(r1)

  const r2 = await db
    .updateTable('person')
    .set({ age: 76 })
    .where('first_name', '=', 'Arnold')
    .returningAll()
    .clearReturning()
    .returning('age')
    .executeTakeFirstOrThrow()

  expectType<{ age: number }>(r2)
}

async function testClearDelete(db: Kysely<Database>) {
  const r1 = await db
    .deleteFrom('person')
    .where('first_name', '=', 'Bruce')
    .returning(['first_name', 'gender'])
    .clearReturning()
    .returning('id')
    .executeTakeFirstOrThrow()

  expectType<{ id: number }>(r1)

  const r2 = await db
    .deleteFrom('person')
    .where('first_name', '=', 'Bruce')
    .returningAll()
    .clearReturning()
    .returning('age')
    .executeTakeFirstOrThrow()

  expectType<{ age: number }>(r2)
}
