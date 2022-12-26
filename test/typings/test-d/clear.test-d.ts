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
