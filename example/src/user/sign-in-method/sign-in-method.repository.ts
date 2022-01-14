import { Kysely } from 'kysely'
import { Database } from '../../database'
import {
  InsertablePasswordSignInMethodRow,
  PasswordSignInMethodRow,
} from './password-sign-in-method.table'

export async function findPasswordSignInMethod(
  db: Kysely<Database>,
  userId: string
): Promise<PasswordSignInMethodRow | undefined> {
  const method = await db
    .selectFrom('sign_in_method as sim')
    .innerJoin('password_sign_in_method as psim', 'psim.user_id', 'sim.user_id')
    .selectAll('psim')
    .where('sim.type', '=', 'password')
    .where('sim.user_id', '=', userId)
    .executeTakeFirst()

  return method
}

export async function insertPasswordSignInMethod(
  db: Kysely<Database>,
  method: InsertablePasswordSignInMethodRow
): Promise<PasswordSignInMethodRow> {
  await db
    .with('sim', (db) =>
      db
        .insertInto('sign_in_method')
        .values({ user_id: method.user_id, type: 'password' })
    )
    .insertInto('password_sign_in_method')
    .values(method)
    .execute()

  return method
}
