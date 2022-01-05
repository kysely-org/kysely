import { Kysely, Transaction } from 'kysely'
import { authTokenService } from '../authentication/auth-token.service'
import { Database } from '../database'
import { SignedInUser } from './signed-in-user'
import { CreateAnonymousUserRequest, User } from './user'
import { userRepository } from './user.repository'
import { UserRow } from './user.table'

async function createAnonymousUser(
  db: Kysely<Database>,
  request: CreateAnonymousUserRequest
): Promise<SignedInUser> {
  const user = await userRepository.insertUser(db, {
    first_name: request.firstName ?? null,
    last_name: request.lastName ?? null,
    email: null,
  })

  const refreshToken = await authTokenService.createRefreshToken(
    db,
    user.user_id
  )

  const authToken = await authTokenService.createAuthToken(db, refreshToken)

  return {
    refreshToken,
    authToken,
    user: userRowToUser(user),
  }
}

async function findUserById(
  db: Kysely<Database>,
  userId: string
): Promise<User | undefined> {
  const userRow = await userRepository.findUserById(db, userId)

  if (userRow) {
    return userRowToUser(userRow)
  }
}

async function lockUserById(
  trx: Transaction<Database>,
  id: string
): Promise<User | undefined> {
  const userRow = await userRepository.lockUserById(trx, id)

  if (userRow) {
    return userRowToUser(userRow)
  }
}

async function lockUserByEmail(
  trx: Transaction<Database>,
  email: string
): Promise<User | undefined> {
  const userRow = await userRepository.lockUserByEmail(trx, email)

  if (userRow) {
    return userRowToUser(userRow)
  }
}

async function setUserEmail(
  db: Kysely<Database>,
  userId: string,
  email: string
): Promise<void> {
  await userRepository.setUserEmail(db, userId, email)
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
  lockUserById,
  lockUserByEmail,
  userRowToUser,
  createAnonymousUser,
  setUserEmail,
})
