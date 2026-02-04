import { expectError, expectType } from 'tsd'
import type { Kysely, RawBuilder } from '..'
import {
  jsonArrayFrom,
  jsonBuildObject,
  jsonObjectFrom,
} from '../../../helpers/sqlite'
import { sql } from '../../..'

interface Database {
  person: {
    id: number
    name: string
    data: Buffer
    nullable_data: Buffer | null
  }
  pet: {
    id: number
    name: string
    owner_id: number
  }
}

// jsonArrayFrom should error when selecting Buffer columns
async function testJsonArrayFromWithBuffer(db: Kysely<Database>) {
  expectError(
    db
      .selectFrom('person')
      .select((eb) => [
        'id',
        jsonArrayFrom(eb.selectFrom('person').select(['id', 'data'])).as(
          'people',
        ),
      ]),
  )
}

// jsonArrayFrom should error when selecting Buffer | null columns
async function testJsonArrayFromWithNullableBuffer(db: Kysely<Database>) {
  expectError(
    db
      .selectFrom('person')
      .select((eb) => [
        'id',
        jsonArrayFrom(
          eb.selectFrom('person').select(['id', 'nullable_data']),
        ).as('people'),
      ]),
  )
}

// jsonArrayFrom should succeed when no Buffer columns are used
async function testJsonArrayFromWithoutBuffer(db: Kysely<Database>) {
  const result = await db
    .selectFrom('person')
    .select((eb) => [
      'id',
      jsonArrayFrom(
        eb
          .selectFrom('pet')
          .select(['pet.id', 'pet.name'])
          .whereRef('pet.owner_id', '=', 'person.id'),
      ).as('pets'),
    ])
    .execute()

  expectType<{ id: number; pets: { id: number; name: string }[] }[]>(result)
}

// jsonObjectFrom should error when selecting Buffer columns
async function testJsonObjectFromWithBuffer(db: Kysely<Database>) {
  expectError(
    db
      .selectFrom('person')
      .select((eb) => [
        'id',
        jsonObjectFrom(
          eb.selectFrom('person').select(['id', 'data']).limit(1),
        ).as('person_data'),
      ]),
  )
}

// jsonObjectFrom should error when selecting Buffer | null columns
async function testJsonObjectFromWithNullableBuffer(db: Kysely<Database>) {
  expectError(
    db
      .selectFrom('person')
      .select((eb) => [
        'id',
        jsonObjectFrom(
          eb.selectFrom('person').select(['id', 'nullable_data']).limit(1),
        ).as('person_data'),
      ]),
  )
}

// jsonObjectFrom should succeed when no Buffer columns are used
async function testJsonObjectFromWithoutBuffer(db: Kysely<Database>) {
  const result = await db
    .selectFrom('person')
    .select((eb) => [
      'id',
      jsonObjectFrom(
        eb
          .selectFrom('pet')
          .select(['pet.id', 'pet.name'])
          .whereRef('pet.owner_id', '=', 'person.id')
          .limit(1),
      ).as('pet'),
    ])
    .execute()

  expectType<{ id: number; pet: { id: number; name: string } | null }[]>(result)
}

// jsonBuildObject should error when passing Expression<Buffer>
async function testJsonBuildObjectWithBuffer(db: Kysely<Database>) {
  expectError(
    db.selectFrom('person').select((eb) => [
      'id',
      jsonBuildObject({
        name: eb.ref('name'),
        data: eb.ref('data'),
      }).as('obj'),
    ]),
  )
}

// jsonBuildObject should error when passing Expression<Buffer | null>
async function testJsonBuildObjectWithNullableBuffer(db: Kysely<Database>) {
  expectError(
    db.selectFrom('person').select((eb) => [
      'id',
      jsonBuildObject({
        name: eb.ref('name'),
        data: eb.ref('nullable_data'),
      }).as('obj'),
    ]),
  )
}

// jsonBuildObject should succeed when no Buffer values are used
async function testJsonBuildObjectWithoutBuffer(db: Kysely<Database>) {
  const result = await db
    .selectFrom('person')
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

// jsonArrayFrom should succeed when Buffer is cast using sql`hex()` (workaround)
async function testJsonArrayFromWithHexWorkaround(db: Kysely<Database>) {
  const result = await db
    .selectFrom('person')
    .select((eb) => [
      'id',
      jsonArrayFrom(
        eb
          .selectFrom('person')
          .select(['id', sql<string>`hex(data)`.as('data_hex')]),
      ).as('people'),
    ])
    .execute()

  expectType<{ id: number; people: { id: number; data_hex: string }[] }[]>(
    result,
  )
}

// jsonArrayFrom should succeed when Buffer is cast using eb.cast<string>() (workaround)
async function testJsonArrayFromWithCastWorkaround(db: Kysely<Database>) {
  const result = await db
    .selectFrom('person')
    .select((eb) => [
      'id',
      jsonArrayFrom(
        eb
          .selectFrom('person')
          .select(['id', eb.cast<string>('data', 'text').as('data_text')]),
      ).as('people'),
    ])
    .execute()

  expectType<{ id: number; people: { id: number; data_text: string }[] }[]>(
    result,
  )
}

// jsonObjectFrom should succeed when Buffer is cast using sql`hex()` (workaround)
async function testJsonObjectFromWithHexWorkaround(db: Kysely<Database>) {
  const result = await db
    .selectFrom('person')
    .select((eb) => [
      'id',
      jsonObjectFrom(
        eb
          .selectFrom('person')
          .select(['id', sql<string>`hex(data)`.as('data_hex')])
          .limit(1),
      ).as('person_data'),
    ])
    .execute()

  expectType<
    { id: number; person_data: { id: number; data_hex: string } | null }[]
  >(result)
}

// jsonObjectFrom should succeed when Buffer is cast using eb.cast<string>() (workaround)
async function testJsonObjectFromWithCastWorkaround(db: Kysely<Database>) {
  const result = await db
    .selectFrom('person')
    .select((eb) => [
      'id',
      jsonObjectFrom(
        eb
          .selectFrom('person')
          .select(['id', eb.cast<string>('data', 'text').as('data_text')])
          .limit(1),
      ).as('person_data'),
    ])
    .execute()

  expectType<
    { id: number; person_data: { id: number; data_text: string } | null }[]
  >(result)
}

// jsonBuildObject should succeed when Buffer is cast using sql`hex()` (workaround)
async function testJsonBuildObjectWithHexWorkaround(db: Kysely<Database>) {
  const result = await db
    .selectFrom('person')
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
    .selectFrom('person')
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
