import { Next } from 'koa'
import { Context } from '../context'
import {
  AuthTokenExpiredError,
  AuthTokenPayload,
  authTokenService,
} from './auth-token.service'
import { refreshTokenRepository } from './refresh-token.repository'

async function authenticateUser(ctx: Context, next: Next): Promise<void> {
  const { userId } = ctx.params

  if (!userId) {
    ctx.throwError(
      400,
      'NoUserIdParameter',
      'no user id parameter found in the route'
    )
  }

  const authorization = ctx.headers['authorization']

  if (!authorization || !authorization.startsWith('Bearer ')) {
    ctx.throwError(
      400,
      'InvalidAuthorizationHeader',
      'missing or invalid Authorization header'
    )
  }

  const authToken = authorization.substring('Bearer '.length)
  let authTokenPayload: AuthTokenPayload | undefined

  try {
    authTokenPayload = authTokenService.verifyAuthToken({ authToken })
  } catch (error) {
    if (error instanceof AuthTokenExpiredError) {
      ctx.throwError(401, 'ExpiredAuthToken', 'the auth token has expired')
    }

    ctx.throwError(401, 'InvalidAuthToken', 'invalid auth token')
  }

  if (userId !== authTokenPayload.userId) {
    ctx.throwError(403, 'UserMismatch', "wrong user's auth token")
  }

  const refreshToken = await refreshTokenRepository.findRefreshToken(
    ctx.db,
    authTokenPayload.userId,
    authTokenPayload.refreshTokenId
  )

  if (!refreshToken) {
    ctx.throwError(
      404,
      'UserOrRefreshTokenNotFound',
      'either the user or the refresh token has been deleted'
    )
  }

  return next()
}

export const authenticationService = Object.freeze({
  authenticateUser,
})
