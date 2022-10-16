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
    .select(coalesce('last_name').as('last_name'))
    .execute()
  expectType<{ last_name: string | null }>(r1)

  const [r2] = await db
    .selectFrom('person')
    .select(coalesce(db.dynamic.ref('age')).castTo<number>().as('age'))
    .execute()
  expectType<{ age: number }>(r2)

  const [r3] = await db
    .selectFrom('person')
    .select(coalesce(db.dynamic.ref('age')).as('age'))
    .execute()
  expectType<{ age: unknown }>(r3)

  const [r4] = await db
    .selectFrom('person')
    .select(coalesce(value('hi!')).as('hi'))
    .execute()
  expectType<{ hi: string }>(r4)

  const [r5] = await db
    .selectFrom('person')
    .select(coalesce(sql`${'hi!'}`).as('hi'))
    .execute()
  expectType<{ hi: unknown }>(r5)

  const [r6] = await db
    .selectFrom('person')
    .select(coalesce(db.fn.max('age')).as('age'))
    .groupBy('first_name')
    .execute()
  expectType<{ age: number }>(r6)

  const [r7] = await db
    .selectFrom('person')
    .select(coalesce(value(null)).as('void'))
    .execute()
  expectType<{ void: null }>(r7)

  expectError(
    db.selectFrom('person').select(coalesce('no_such_column').as('alias'))
  )

  // no alias
  expectError(db.selectFrom('person').select(coalesce('age')))
}

async function testCoalesceMultiple(db: Kysely<Database>) {
  const { coalesce } = db.fn

  // number, string, Date -> number
  const [r0] = await db
    .selectFrom('person')
    .select(coalesce('age', 'first_name', 'modified_at').as('field'))
    .execute()
  expectType<{ field: number }>(r0)

  // string | null, number, Date -> string | number
  const [r1] = await db
    .selectFrom('person')
    .select(coalesce('last_name', 'age', 'modified_at').as('field'))
    .execute()
  expectType<{ field: string | number }>(r1)

  // null, string | null, string, number -> string
  const [r2] = await db
    .selectFrom('person')
    .select(
      coalesce(value(null), 'last_name', db.fn.max('first_name'), 'age').as(
        'field'
      )
    )
    .groupBy(['last_name', 'first_name', 'age'])
    .execute()
  expectType<{ field: string }>(r2)

  // string | null, string -> string
  const [r3] = await db
    .selectFrom('person')
    .select(
      coalesce(
        db.fn.max<string | null, 'first_name'>('first_name'),
        sql<string>`${sql.literal('N/A')}`
      ).as('max_first_name')
    )
    .execute()
  expectType<{ max_first_name: string }>(r3)
}

function value<V>(value: V): RawBuilder<V> {
  return sql`${value}`
}
