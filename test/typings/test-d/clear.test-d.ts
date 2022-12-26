import { Kysely } from '..'
import { Database } from '../shared'
import { expectType } from 'tsd'

async function testClearSelect(db: Kysely<Database>) {
  const row = await db
    .selectFrom('person')
    .select(['first_name', 'gender'])
    .clearSelect()
    .select('id')
    .executeTakeFirstOrThrow()

  expectType<{ id: number }>(row)
}
