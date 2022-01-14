import * as userRepository from './user.repository'
import * as authTokenService from '../authentication/auth-token.service'

import { Kysely, Transaction } from 'kysely'
import { Database } from '../database'
import { SignedInUser } from './signed-in-user'
import { CreateAnonymousUserRequest, User } from './user'
import { UserRow } from './user.table'

export async function createAnonymousUser(
  db: Kysely<Database>,
  request: CreateAnonymousUserRequest
): Promise<SignedInUser> {
  const user = await userRepository.insertUser(db, {
    first_name: request.firstName,
    last_name: request.lastName,
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

export async function findUserById(
  db: Kysely<Database>,
  userId: string
): Promise<User | undefined> {
  const userRow = await userRepository.findUserById(db, userId)

  if (userRow) {
    return userRowToUser(userRow)
  }
}

export async function lockUserById(
  trx: Transaction<Database>,
  id: string
): Promise<User | undefined> {
  const userRow = await userRepository.lockUserById(trx, id)

  if (userRow) {
    return userRowToUser(userRow)
  }
}

export async function lockUserByEmail(
  trx: Transaction<Database>,
  email: string
): Promise<User | undefined> {
  const userRow = await userRepository.lockUserByEmail(trx, email)

  if (userRow) {
    return userRowToUser(userRow)
  }
}

export async function setUserEmail(
  db: Kysely<Database>,
  userId: string,
  email: string
): Promise<void> {
  await userRepository.setUserEmail(db, userId, email)
}

export function userRowToUser(user: UserRow): User {
  return {
    id: user.user_id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
  }
}
