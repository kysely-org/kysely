import { Kysely } from 'kysely'
import { Database } from '../database'
import { User } from './user'
import { UserRow } from './user.row'
import * as userRepository from './user.repository'

export async function getUserById(
  db: Kysely<Database>,
  userId: number
): Promise<User | undefined> {
  const userRow = await userRepository.getUserById(db, userId)

  if (userRow) {
    return userRowToUser(userRow)
  }
}

export function userRowToUser(user: UserRow): User {
  return {
    id: user.user_id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
  }
}
