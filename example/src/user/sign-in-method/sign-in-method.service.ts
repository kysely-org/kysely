import * as crypto from 'crypto'
import { Transaction } from 'kysely'
import { authTokenService } from '../../authentication/auth-token.service'
import { Database } from '../../database'
import { UserNotFoundError } from '../../util/errors'
import { SignedInUser } from '../signed-in-user'
import { userService } from '../user.service'
import { PasswordSignInMethod } from './sign-in-method'
import { signInMethodRepository } from './sign-in-method.repository'

export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 255

export class UserAlreadyHasSignInMethodError extends Error {}
export class SignInMethodNotFoundError extends Error {}
export class WrongPasswordError extends Error {}
export class PasswordTooWeakError extends Error {}
export class PasswordTooLongError extends Error {}

async function addPasswordSignInMethod(
  trx: Transaction<Database>,
  userId: string,
  method: PasswordSignInMethod
): Promise<void> {
  const user = await userService.lockUserById(trx, userId)

  if (!user) {
    throw new UserNotFoundError()
  }

  if (user.email) {
    throw new UserAlreadyHasSignInMethodError()
  }

  await signInMethodRepository.insertPasswordSignInMethod(trx, {
    user_id: userId,
    password_hash: await encryptPassword(method.password),
  })

  await userService.setUserEmail(trx, userId, method.email)
}

async function encryptPassword(password: string): Promise<string> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new PasswordTooWeakError()
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new PasswordTooLongError()
  }

  return encryptSecret(password)
}

async function encryptSecret(secret: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  return `${salt}:${await scrypt(secret, salt)}`
}

async function verifySecret(secret: string, hash: string): Promise<boolean> {
  const [salt, secretHash] = hash.split(':')
  return (await scrypt(secret, salt)) === secretHash
}

async function scrypt(secret: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      secret,
      salt,
      64,
      { N: 16384, r: 8, p: 1 },
      (err, secretHash) => {
        if (err) {
          return reject(err)
        }

        resolve(secretHash.toString('hex'))
      }
    )
  })
}

async function singInUsingPassword(
  trx: Transaction<Database>,
  method: PasswordSignInMethod
): Promise<SignedInUser> {
  const user = await userService.lockUserByEmail(trx, method.email)

  if (!user) {
    throw new UserNotFoundError()
  }

  const signInMethod = await signInMethodRepository.findPasswordSignInMethod(
    trx,
    user.id
  )

  if (!signInMethod) {
    throw new SignInMethodNotFoundError()
  }

  if (!(await verifyPassword(method.password, signInMethod.password_hash))) {
    throw new WrongPasswordError()
  }

  const refreshToken = await authTokenService.createRefreshToken(trx, user.id)
  const authToken = await authTokenService.createAuthToken(trx, refreshToken)

  return {
    user,
    authToken,
    refreshToken,
  }
}

async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return verifySecret(password, hash)
}

export const signInMethodService = Object.freeze({
  addPasswordSignInMethod,
  singInUsingPassword,
})
