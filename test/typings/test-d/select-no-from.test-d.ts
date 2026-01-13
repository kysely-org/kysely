import { type Kysely, type SqlBool, sql } from '..'
import type { Database } from '../shared'
import { expectType } from 'tsd'

async function testSelectNoFrom(db: Kysely<Database>) {
  const r1 = await db
    .selectNoFrom(sql<'bar'>`select 'bar'`.as('foo'))
    .executeTakeFirstOrThrow()
  expectType<{ foo: 'bar' }>(r1)

  const r2 = await db
    .selectNoFrom((eb) => eb(eb.val(1), '=', 1).as('very_useful'))
    .executeTakeFirstOrThrow()
  expectType<{ very_useful: SqlBool }>(r2)

  const r3 = await db
    .selectNoFrom([
      sql<'bar'>`select 'bar'`.as('foo'),
      db.selectFrom('pet').select('id').limit(1).as('pet_id'),
    ])
    .executeTakeFirstOrThrow()
  expectType<{ foo: 'bar'; pet_id: string | null }>(r3)

  const r4 = await db
    .selectNoFrom((eb) => [
      eb(eb.val(1), '=', 1).as('very_useful'),
      eb.selectFrom('pet').select('id').limit(1).as('pet_id'),
    ])
    .executeTakeFirstOrThrow()
  expectType<{ very_useful: SqlBool; pet_id: string | null }>(r4)
}
