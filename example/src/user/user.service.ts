import { Kysely } from 'kysely'
import {
  AuthToken,
  authTokenService,
  RefreshToken,
} from '../authentication/auth-token.service'
import { Database } from '../database'
import { CreateAnonymousUserRequest, User } from './user'
import { userRepository } from './user.repository'
import { UserRow } from './user.row'

export interface SignedInUser {
  refreshToken: RefreshToken
  authToken: AuthToken
  user: User
}

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
  createAnonymousUser,
})
