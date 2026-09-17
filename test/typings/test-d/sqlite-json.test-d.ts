import { expectAssignable, expectError, expectType } from 'tsd'
import * as mssql from '../../../dist/helpers/mssql.js'
import * as mysql from '../../../dist/helpers/mysql.js'
import * as postgres from '../../../dist/helpers/postgres.js'
import {
  jsonArrayFrom,
  jsonBuildObject,
  jsonObjectFrom,
} from '../../../dist/helpers/sqlite.js'
import { type Kysely, sql } from '../index.js'

// Shared dialect interfaces can use the more restrictive SQLite signatures.
expectAssignable<typeof jsonArrayFrom>(postgres.jsonArrayFrom)
expectAssignable<typeof jsonArrayFrom>(mysql.jsonArrayFrom)
expectAssignable<typeof jsonArrayFrom>(mssql.jsonArrayFrom)
expectAssignable<typeof jsonObjectFrom>(postgres.jsonObjectFrom)
expectAssignable<typeof jsonObjectFrom>(mysql.jsonObjectFrom)
expectAssignable<typeof jsonObjectFrom>(mssql.jsonObjectFrom)
expectAssignable<typeof jsonBuildObject>(postgres.jsonBuildObject)
expectAssignable<typeof jsonBuildObject>(mysql.jsonBuildObject)
expectAssignable<typeof jsonBuildObject>(mssql.jsonBuildObject)

interface Database {
  blob_test: {
    id: number
    name: string
    data: Buffer
    nullable_data: Buffer | null
    uint8_data: Uint8Array
    any_data: any
    mixed_data: Buffer | string
  }
}

async function testJsonArrayFrom(db: Kysely<Database>) {
  const r1 = await db
    .selectFrom('blob_test')
    .select((eb) => [
      'id',
      jsonArrayFrom(
        eb
          .selectFrom('blob_test')
          .select(['blob_test.id', 'blob_test.name'])
          .where('blob_test.id', '>', 0),
      ).as('rows'),
    ])
    .execute()

  expectType<{ id: number; rows: { id: number; name: string }[] }[]>(r1)

  const r2 = await db
    .selectFrom('blob_test')
    .select((eb) => [
      'id',
      jsonArrayFrom(
        eb
          .selectFrom('blob_test')
          .select(['id', sql`1`.as('one')])
          .where('blob_test.id', '>', 0),
      ).as('rows'),
    ])
    .execute()

  expectType<{ id: number; rows: { id: number; one: unknown }[] }[]>(r2)

  expectError(
    db
      .selectFrom('blob_test')
      .select((eb) => [
        'id',
        jsonArrayFrom(eb.selectFrom('blob_test').select(['id', 'data'])).as(
          'rows',
        ),
      ]),
  )

  expectError(
    db
      .selectFrom('blob_test')
      .select((eb) => [
        'id',
        jsonArrayFrom(
          eb.selectFrom('blob_test').select(['id', 'nullable_data']),
        ).as('rows'),
      ]),
  )

  expectError(
    db
      .selectFrom('blob_test')
      .select((eb) => [
        'id',
        jsonArrayFrom(
          eb.selectFrom('blob_test').select(['id', 'uint8_data']),
        ).as('rows'),
      ]),
  )

  expectError(
    db
      .selectFrom('blob_test')
      .select((eb) => [
        'id',
        jsonArrayFrom(eb.selectFrom('blob_test').select(['id', 'any_data'])).as(
          'rows',
        ),
      ]),
  )
}

async function testJsonObjectFrom(db: Kysely<Database>) {
  const r1 = await db
    .selectFrom('blob_test')
    .select((eb) => [
      'id',
      jsonObjectFrom(
        eb
          .selectFrom('blob_test')
          .select(['blob_test.id', 'blob_test.name'])
          .where('blob_test.id', '>', 0)
          .limit(1),
      ).as('row'),
    ])
    .execute()

  expectType<{ id: number; row: { id: number; name: string } | null }[]>(r1)

  const r2 = await db
    .selectFrom('blob_test')
    .select((eb) => [
      'id',
      jsonObjectFrom(
        eb
          .selectFrom('blob_test')
          .select(['id', sql`1`.as('one')])
          .where('blob_test.id', '>', 0)
          .limit(1),
      ).as('row'),
    ])
    .execute()

  expectType<{ id: number; row: { id: number; one: unknown } | null }[]>(r2)

  expectError(
    db
      .selectFrom('blob_test')
      .select((eb) => [
        'id',
        jsonObjectFrom(
          eb.selectFrom('blob_test').select(['id', 'data']).limit(1),
        ).as('row'),
      ]),
  )

  expectError(
    db
      .selectFrom('blob_test')
      .select((eb) => [
        'id',
        jsonObjectFrom(
          eb.selectFrom('blob_test').select(['id', 'nullable_data']).limit(1),
        ).as('row'),
      ]),
  )

  expectError(
    db
      .selectFrom('blob_test')
      .select((eb) => [
        'id',
        jsonObjectFrom(
          eb.selectFrom('blob_test').select(['id', 'mixed_data']).limit(1),
        ).as('row'),
      ]),
  )

  expectError(
    db
      .selectFrom('blob_test')
      .select((eb) => [
        'id',
        jsonObjectFrom(
          eb.selectFrom('blob_test').select(['id', 'any_data']),
        ).as('row'),
      ]),
  )
}

async function testJsonBuildObject(db: Kysely<Database>) {
  const r1 = await db
    .selectFrom('blob_test')
    .select((eb) => [
      'id',
      jsonBuildObject({
        name: eb.ref('name'),
        computed: sql<string>`upper(name)`,
      }).as('obj'),
    ])
    .execute()

  expectType<{ id: number; obj: { name: string; computed: string } }[]>(r1)

  const r2 = await db
    .selectFrom('blob_test')
    .select((eb) => [
      'id',
      jsonBuildObject({
        name: eb.ref('name'),
        one: sql`1`,
      }).as('obj'),
    ])
    .execute()

  expectType<{ id: number; obj: { name: string; one: unknown } }[]>(r2)

  expectError(
    db.selectFrom('blob_test').select((eb) => [
      'id',
      jsonBuildObject({
        name: eb.ref('name'),
        data: eb.ref('data'),
      }).as('obj'),
    ]),
  )

  expectError(
    db.selectFrom('blob_test').select((eb) => [
      'id',
      jsonBuildObject({
        name: eb.ref('name'),
        data: eb.ref('nullable_data'),
      }).as('obj'),
    ]),
  )

  expectError(
    db.selectFrom('blob_test').select((eb) => [
      'id',
      jsonBuildObject({
        name: eb.ref('name'),
        data: eb.ref('any_data'),
      }).as('obj'),
    ]),
  )
}
