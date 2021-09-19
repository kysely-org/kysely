import * as crypto from 'crypto'
import { Transaction } from 'kysely'
import { Database } from '../../database'
import { UserNotFoundError } from '../../util/errors'
import { userRepository } from '../user.repository'
import { PasswordSignInMethod } from './sign-in-method'
import { signInMethodRepository } from './sign-in-method.repository'

export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 255

export class UserAlreadyHasSignInMethod extends Error {}
export class PasswordTooWeakError extends Error {}
export class PasswordTooLongError extends Error {}

async function addPasswordSignInMethod(
  trx: Transaction<Database>,
  userId: string,
  method: PasswordSignInMethod
): Promise<void> {
  const user = await userRepository.lockUser(trx, userId)

  if (!user) {
    throw new UserNotFoundError()
  }

  if (user.email) {
    throw new UserAlreadyHasSignInMethod()
  }

  await signInMethodRepository.insertPasswordSignInMethod(trx, {
    user_id: userId,
    password_hash: await encryptPassword(method.password),
  })

  await userRepository.setUserEmail(trx, userId, method.email)
}

export async function encryptPassword(password: string): Promise<string> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new PasswordTooWeakError()
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new PasswordTooLongError()
  }

  return encryptSecret(password)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return verifySecret(password, hash)
}

export async function encryptSecret(secret: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  return `${salt}:${await scrypt(secret, salt)}`
}

export async function verifySecret(
  secret: string,
  hash: string
): Promise<boolean> {
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

export const signInMethodService = Object.freeze({
  addPasswordSignInMethod,
})
