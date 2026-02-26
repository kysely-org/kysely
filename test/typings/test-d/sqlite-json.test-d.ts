import { expectError, expectType } from 'tsd'
import type { Kysely } from '..'
import type { Database as SharedDatabase } from '../shared'
import {
  jsonArrayFrom,
  jsonBuildObject,
  jsonObjectFrom,
} from '../../../helpers/sqlite'
import { sql } from '../../..'

interface Database extends SharedDatabase {
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

// jsonArrayFrom should error when selecting Buffer columns
function testJsonArrayFromWithBuffer(db: Kysely<Database>) {
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
}

// jsonArrayFrom should error when selecting Buffer | null columns
function testJsonArrayFromWithNullableBuffer(db: Kysely<Database>) {
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
}

// jsonArrayFrom should succeed when no Buffer columns are used
async function testJsonArrayFromWithoutBuffer(db: Kysely<Database>) {
  const result = await db
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

  expectType<{ id: number; rows: { id: number; name: string }[] }[]>(result)
}

// jsonObjectFrom should error when selecting Buffer columns
function testJsonObjectFromWithBuffer(db: Kysely<Database>) {
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
}

// jsonObjectFrom should error when selecting Buffer | null columns
function testJsonObjectFromWithNullableBuffer(db: Kysely<Database>) {
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
}

// jsonObjectFrom should succeed when no Buffer columns are used
async function testJsonObjectFromWithoutBuffer(db: Kysely<Database>) {
  const result = await db
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

  expectType<{ id: number; row: { id: number; name: string } | null }[]>(result)
}

// jsonBuildObject should error when passing Expression<Buffer>
function testJsonBuildObjectWithBuffer(db: Kysely<Database>) {
  expectError(
    db.selectFrom('blob_test').select((eb) => [
      'id',
      jsonBuildObject({
        name: eb.ref('name'),
        data: eb.ref('data'),
      }).as('obj'),
    ]),
  )
}

// jsonBuildObject should error when passing Expression<Buffer | null>
function testJsonBuildObjectWithNullableBuffer(db: Kysely<Database>) {
  expectError(
    db.selectFrom('blob_test').select((eb) => [
      'id',
      jsonBuildObject({
        name: eb.ref('name'),
        data: eb.ref('nullable_data'),
      }).as('obj'),
    ]),
  )
}

// jsonArrayFrom should error when selecting Uint8Array columns
function testJsonArrayFromWithUint8Array(db: Kysely<Database>) {
  expectError(
    db
      .selectFrom('blob_test')
      .select((eb) => [
        'id',
        jsonArrayFrom(eb.selectFrom('blob_test').select(['id', 'uint8_data'])).as(
          'rows',
        ),
      ]),
  )
}

// jsonObjectFrom should error when selecting Buffer | string columns
function testJsonObjectFromWithMixedBufferString(db: Kysely<Database>) {
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
}

// jsonArrayFrom should error when selecting any-typed columns
function testJsonArrayFromWithAny(db: Kysely<Database>) {
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

// jsonObjectFrom should error when selecting any-typed columns
function testJsonObjectFromWithAny(db: Kysely<Database>) {
  expectError(
    db
      .selectFrom('blob_test')
      .select((eb) => [
        'id',
        jsonObjectFrom(eb.selectFrom('blob_test').select(['id', 'any_data']))
          .as('row'),
      ]),
  )
}

// jsonBuildObject should error when passing Expression<any>
function testJsonBuildObjectWithAny(db: Kysely<Database>) {
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

// jsonBuildObject should succeed when no Buffer values are used
async function testJsonBuildObjectWithoutBuffer(db: Kysely<Database>) {
  const result = await db
    .selectFrom('blob_test')
    .select((eb) => [
      'id',
      jsonBuildObject({
        name: eb.ref('name'),
        computed: sql<string>`upper(name)`,
      }).as('obj'),
    ])
    .execute()

  expectType<{ id: number; obj: { name: string; computed: string } }[]>(result)
}

// jsonBuildObject should succeed with untyped sql expressions (unknown)
async function testJsonBuildObjectWithUntypedSql(db: Kysely<Database>) {
  const result = await db
    .selectFrom('blob_test')
    .select((eb) => [
      'id',
      jsonBuildObject({
        name: eb.ref('name'),
        one: sql`1`,
      }).as('obj'),
    ])
    .execute()

  expectType<{ id: number; obj: { name: string; one: unknown } }[]>(result)
}

// jsonArrayFrom should succeed with untyped sql expressions (unknown)
async function testJsonArrayFromWithUntypedSql(db: Kysely<Database>) {
  const result = await db
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

  expectType<{ id: number; rows: { id: number; one: unknown }[] }[]>(result)
}

// jsonObjectFrom should succeed with untyped sql expressions (unknown)
async function testJsonObjectFromWithUntypedSql(db: Kysely<Database>) {
  const result = await db
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

  expectType<{ id: number; row: { id: number; one: unknown } | null }[]>(result)
}

// jsonArrayFrom should succeed when Buffer is cast using sql`hex()` (workaround)
async function testJsonArrayFromWithHexWorkaround(db: Kysely<Database>) {
  const result = await db
    .selectFrom('blob_test')
    .select((eb) => [
      'id',
      jsonArrayFrom(
        eb
          .selectFrom('blob_test')
          .select(['id', sql<string>`hex(data)`.as('data_hex')]),
      ).as('rows'),
    ])
    .execute()

  expectType<{ id: number; rows: { id: number; data_hex: string }[] }[]>(result)
}

// jsonArrayFrom should succeed when Buffer is cast using eb.cast<string>() (workaround)
async function testJsonArrayFromWithCastWorkaround(db: Kysely<Database>) {
  const result = await db
    .selectFrom('blob_test')
    .select((eb) => [
      'id',
      jsonArrayFrom(
        eb
          .selectFrom('blob_test')
          .select(['id', eb.cast<string>('data', 'text').as('data_text')]),
      ).as('rows'),
    ])
    .execute()

  expectType<{ id: number; rows: { id: number; data_text: string }[] }[]>(
    result,
  )
}

// jsonObjectFrom should succeed when Buffer is cast using sql`hex()` (workaround)
async function testJsonObjectFromWithHexWorkaround(db: Kysely<Database>) {
  const result = await db
    .selectFrom('blob_test')
    .select((eb) => [
      'id',
      jsonObjectFrom(
        eb
          .selectFrom('blob_test')
          .select(['id', sql<string>`hex(data)`.as('data_hex')])
          .limit(1),
      ).as('row'),
    ])
    .execute()

  expectType<{ id: number; row: { id: number; data_hex: string } | null }[]>(
    result,
  )
}

// jsonObjectFrom should succeed when Buffer is cast using eb.cast<string>() (workaround)
async function testJsonObjectFromWithCastWorkaround(db: Kysely<Database>) {
  const result = await db
    .selectFrom('blob_test')
    .select((eb) => [
      'id',
      jsonObjectFrom(
        eb
          .selectFrom('blob_test')
          .select(['id', eb.cast<string>('data', 'text').as('data_text')])
          .limit(1),
      ).as('row'),
    ])
    .execute()

  expectType<{ id: number; row: { id: number; data_text: string } | null }[]>(
    result,
  )
}

// jsonBuildObject should succeed when Buffer is cast using sql`hex()` (workaround)
async function testJsonBuildObjectWithHexWorkaround(db: Kysely<Database>) {
  const result = await db
    .selectFrom('blob_test')
    .select((eb) => [
      'id',
      jsonBuildObject({
        name: eb.ref('name'),
        data: sql<string>`hex(data)`,
      }).as('obj'),
    ])
    .execute()

  expectType<{ id: number; obj: { name: string; data: string } }[]>(result)
}

// jsonBuildObject should succeed when Buffer is cast using eb.cast<string>() (workaround)
async function testJsonBuildObjectWithCastWorkaround(db: Kysely<Database>) {
  const result = await db
    .selectFrom('blob_test')
    .select((eb) => [
      'id',
      jsonBuildObject({
        name: eb.ref('name'),
        data: eb.cast<string>('data', 'text'),
      }).as('obj'),
    ])
    .execute()

  expectType<{ id: number; obj: { name: string; data: string } }[]>(result)
}
