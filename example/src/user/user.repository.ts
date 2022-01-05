import { Kysely, Transaction } from 'kysely'
import { Database } from '../database'
import { InsertableUserRow, UserRow } from './user.table'

async function insertUser(
  db: Kysely<Database>,
  user: InsertableUserRow
): Promise<UserRow> {
  const [insertedUser] = await db
    .insertInto('user')
    .values(user)
    .returningAll()
    .execute()

  return insertedUser
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

async function lockUserById(
  trx: Transaction<Database>,
  id: string
): Promise<UserRow | undefined> {
  return lockUser(trx, 'user_id', id)
}

async function lockUserByEmail(
  trx: Transaction<Database>,
  email: string
): Promise<UserRow | undefined> {
  return lockUser(trx, 'email', email)
}

async function lockUser(
  trx: Transaction<Database>,
  column: 'user_id' | 'email',
  value: string
): Promise<UserRow | undefined> {
  const user = await trx
    .selectFrom('user')
    .where(column, '=', value)
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
  lockUserById,
  lockUserByEmail,
  setUserEmail,
})
