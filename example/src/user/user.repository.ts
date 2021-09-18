import { Kysely } from 'kysely'
import { Database } from '../database'
import { UserRow } from './user.row'

async function insertUser(
  db: Kysely<Database>,
  user: Omit<UserRow, 'user_id' | 'created_at'>
): Promise<UserRow> {
  const [{ user_id, created_at }] = await db
    .insertInto('user')
    .values(user)
    .returning(['user_id', 'created_at'])
    .execute()

  return { ...user, user_id, created_at }
}

async function findUserById(
  db: Kysely<Database>,
  id: string
): Promise<UserRow | undefined> {
  const user = await db
    .selectFrom('user')
    .where('user_id', '=', id)
    .selectAll('user')
    .executeTakeFirst()

  return user
}

async function lockUser(
  db: Kysely<Database>,
  id: string
): Promise<UserRow | undefined> {
  const user = await db
    .selectFrom('user')
    .where('user_id', '=', id)
    .selectAll('user')
    .forUpdate()
    .executeTakeFirst()

  return user
}

async function setUserEmail(
  db: Kysely<Database>,
  id: string,
  email: string
): Promise<void> {
  await db
    .updateTable('user')
    .where('user_id', '=', id)
    .set({ email })
    .execute()
}

export const userRepository = Object.freeze({
  insertUser,
  findUserById,
  lockUser,
  setUserEmail
})
