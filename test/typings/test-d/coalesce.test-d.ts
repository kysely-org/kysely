import { expectError, expectType } from 'tsd'
import { Kysely, RawBuilder, sql } from '..'
import { Database } from '../shared'

async function testCoalesceSingle(db: Kysely<Database>) {
  const { coalesce } = db.fn

  const [r0] = await db
    .selectFrom('person')
    .select(coalesce('age').as('age'))
    .execute()
  expectType<{ age: number }>(r0)

  const [r1] = await db
    .selectFrom('person')
    .select(coalesce(db.dynamic.ref('age')).castTo<number>().as('age'))
    .execute()
  expectType<{ age: number }>(r1)

  const [r2] = await db
    .selectFrom('person')
    .select(coalesce(db.dynamic.ref('age')).as('age'))
    .execute()
  expectType<{ age: unknown }>(r2)

  const [r3] = await db
    .selectFrom('person')
    .select(coalesce(value('hi!')).as('hi'))
    .execute()
  expectType<{ hi: string }>(r3)

  const [r4] = await db
    .selectFrom('person')
    .select(coalesce(sql`${'hi!'}`).as('hi'))
    .execute()
  expectType<{ hi: unknown }>(r4)

  const [r5] = await db
    .selectFrom('person')
    .select(coalesce(db.fn.max('age')).as('age'))
    .groupBy('first_name')
    .execute()
  expectType<{ age: number }>(r5)

  expectError(
    db.selectFrom('person').select(coalesce('no_such_column').alias('alias'))
  )

  // no alias
  expectError(db.selectFrom('person').select(coalesce('no_such_column')))
}

function value<V>(value: V): RawBuilder<V> {
  return sql`${value}`
}
