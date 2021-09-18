import { Kysely } from 'kysely'
import { Database } from '../database'
import { UserRow } from './user.row'

export async function insertUser(
  db: Kysely<Database>,
  user: Omit<UserRow, 'user_id'>
): Promise<UserRow> {
  const [userId] = await db
    .insertInto('user')
    .values(user)
    .returning('user_id')
    .execute()

  return {
    ...user,
    user_id: userId.user_id,
  }
}

export async function getUserById(
  db: Kysely<Database>,
  id: number
): Promise<UserRow | undefined> {
  const user = await db
    .selectFrom('user')
    .where('user_id', '=', id)
    .selectAll('user')
    .executeTakeFirst()

  return user
}
