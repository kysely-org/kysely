import { expectError, expectType } from 'tsd'
import { ExpressionBuilder, JSONPathBuilder, Kysely } from '..'
import { Database, PersonMetadata } from '../shared'
import { expect } from 'chai'
import { KyselyTypeError } from '../../../dist/cjs/util/type-error'

async function testJSONReference(db: Kysely<Database>) {
  const [r1] = await db
    .selectFrom('person_metadata')
    .select((eb) => eb.ref('website', '->>$').key('url').as('website_url'))
    .execute()

  expectType<{ website_url: string }>(r1)

  const [r2] = await db
    .selectFrom('person_metadata')
    .select((eb) => eb.ref('nicknames', '->>$').at(0).as('nickname'))
    .execute()

  expectType<{ nickname: string | null }>(r2)

  const [r3] = await db
    .selectFrom('person_metadata')
    .select((eb) =>
      eb.ref('profile', '->>$').key('auth').key('roles').as('roles'),
    )
    .execute()

  expectType<{ roles: string[] }>(r3)

  const [r4] = await db
    .selectFrom('person_metadata')
    .select((eb) => eb.ref('profile', '->>$').key('tags').at(0).as('main_tag'))
    .execute()

  expectType<{ main_tag: string | null }>(r4)

  const [r5] = await db
    .selectFrom('person_metadata')
    .select((eb) =>
      eb
        .ref('experience', '->>$')
        .at(0)
        .key('establishment')
        .as('establishment'),
    )
    .execute()

  expectType<{ establishment: string | null }>(r5)

  const [r6] = await db
    .selectFrom('person_metadata')
    .select((eb) =>
      eb.ref('schedule', '->>$').at(0).at(0).as('january_1st_schedule'),
    )
    .execute()

  expectType<{ january_1st_schedule: { name: string; time: string }[] | null }>(
    r6,
  )

  const [r7] = await db
    .selectFrom('person_metadata')
    .select((eb) => eb.ref('nicknames', '->>$').at('last').as('nickname'))
    .execute()

  expectType<{ nickname: string | null }>(r7)

  const [r8] = await db
    .selectFrom('person_metadata')
    .select((eb) => eb.ref('nicknames', '->>$').at('#-1').as('nickname'))
    .execute()

  expectType<{ nickname: string | null }>(r8)

  const [r9] = await db
    .selectFrom('person_metadata')
    .select((eb) => eb.ref('record', '->').key('i_dunno_man').as('whatever'))
    .execute()

  expectType<{ whatever: string | null }>(r9)

  const [r10] = await db
    .selectFrom('person_metadata')
    .select((eb) => eb.ref('array', '->').at(0).as('whenever'))
    .execute()

  expectType<{ whenever: string | null }>(r10)

  // missing operator

  expectError(
    db
      .selectFrom('person_metadata')
      .select((eb) => eb.ref('experience').at(0).as('alias')),
  )

  expectError(
    db
      .selectFrom('person_metadata')
      .select((eb) => eb.ref('website').key('url').as('alias')),
  )

  // invalid operator

  expectError(
    db
      .selectFrom('person_metadata')
      .select((eb) =>
        eb.ref('website', 'NO_SUCH_OPERATOR').key('url').as('alias'),
      )
      .execute(),
  )

  // use `key` on non-object

  expectError(
    db
      .selectFrom('person_metadata')
      .select((eb) => eb.ref('nicknames', '->>$').key('url').as('alias'))
      .execute(),
  )

  expectError(
    db
      .selectFrom('person_metadata')
      .select((eb) => [
        eb.ref('website', '->>').key('url').key('length').as('alias'),
        eb.ref('schedule', '->>').key('length').as('alias2'),
      ])
      .execute(),
  )

  // use `at` on non-array

  expectError(
    db
      .selectFrom('person_metadata')
      .select((eb) => eb.ref('website', '->>$').at(0).as('alias'))
      .execute(),
  )

  expectError(
    db
      .selectFrom('person_metadata')
      .select((eb) => eb.ref('experience', '->>').at(0).at(-1).as('alias'))
      .execute(),
  )

  // bad key

  expectError(
    db
      .selectFrom('person_metadata')
      .select((eb) =>
        eb.ref('website', '->>$').key('NO_SUCH_FIELD').as('alias'),
      )
      .execute(),
  )

  // bad index

  expectError(
    db
      .selectFrom('person_metadata')
      .select((eb) => eb.ref('nicknames', '->>$').at('0').as('alias'))
      .execute(),
  )

  expectError(
    db
      .selectFrom('person_metadata')
      .select((eb) => eb.ref('nicknames', '->>$').at(0.5).as('alias'))
      .execute(),
  )

  expectError(
    db
      .selectFrom('person_metadata')
      .select((eb) => eb.ref('nicknames', '->>$').at('#--1').as('alias'))
      .execute(),
  )

  expectError(
    db
      .selectFrom('person_metadata')
      .select((eb) => eb.ref('nicknames', '->>$').at('#-1.5').as('alias'))
      .execute(),
  )

  expectError(
    db
      .selectFrom('person_metadata')
      .select((eb) => eb.ref('nicknames', '->>$').at('last ').as('alias'))
      .execute(),
  )
}

async function testJSONPath(eb: ExpressionBuilder<Database, keyof Database>) {
  expectType<JSONPathBuilder<PersonMetadata['experience']>>(
    eb.jsonPath<'experience'>(),
  )

  expectType<JSONPathBuilder<PersonMetadata['experience']>>(
    eb.jsonPath<'person_metadata.experience'>(),
  )

  expectError(eb.jsonPath('experience'))
  expectError(eb.jsonPath('person_metadata.experience'))
  expectType<
    KyselyTypeError<"You must provide a column reference as this method's $ generic">
  >(eb.jsonPath())
  expectError(eb.jsonPath<'NO_SUCH_COLUMN'>())
}
