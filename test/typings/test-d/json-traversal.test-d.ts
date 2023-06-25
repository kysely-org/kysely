import { expectError, expectType } from 'tsd'
import { Kysely } from '..'
import { Database } from '../shared'

async function testJSONTraversal(db: Kysely<Database>) {
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
      eb.ref('profile', '->>$').key('auth').key('roles').as('roles')
    )
    .execute()

  expectType<{ roles: string[] | null }>(r3)

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
        .as('establishment')
    )
    .execute()

  expectType<{ establishment: string | null }>(r5)

  const [r6] = await db
    .selectFrom('person_metadata')
    .select((eb) =>
      eb.ref('schedule', '->>$').at(0).at(0).as('january_1st_schedule')
    )
    .execute()

  expectType<{ january_1st_schedule: { name: string; time: string }[] | null }>(
    r6
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

  // missing operator

  expectError(
    db
      .selectFrom('person_metadata')
      .select((eb) => eb.ref('experience').at(0).as('alias'))
  )

  expectError(
    db
      .selectFrom('person_metadata')
      .select((eb) => eb.ref('website').key('url').as('alias'))
  )

  // invalid operator

  expectError(
    db
      .selectFrom('person_metadata')
      .select((eb) =>
        eb.ref('website', 'NO_SUCH_OPERATOR').key('url').as('alias')
      )
      .execute()
  )
}
