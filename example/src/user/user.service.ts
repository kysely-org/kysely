import { Kysely } from 'kysely'
import { Database } from '../database'
import { User } from './user'
import { userRepository } from './user.repository'
import { UserRow } from './user.row'

async function findUserById(
  db: Kysely<Database>,
  userId: string
): Promise<User | undefined> {
  const userRow = await userRepository.findUserById(db, userId)

  if (userRow) {
    return userRowToUser(userRow)
  }
}

function userRowToUser(user: UserRow): User {
  return {
    id: user.user_id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
  }
}

export const userService = Object.freeze({
  findUserById,
  userRowToUser,
})
