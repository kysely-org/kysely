import * as jwt from 'jsonwebtoken'
import { Kysely } from 'kysely'
import { config } from '../config'
import { Database } from '../database'
import { refreshTokenRepository } from './refresh-token.repository'

export class AuthTokenError extends Error {}
export class InvalidAuthTokenError extends AuthTokenError {}
export class AuthTokenExpiredError extends AuthTokenError {}

export interface AuthToken {
  authToken: string
}

interface AuthTokenPayload {
  userId: string
  refreshTokenId: string
}

export interface RefreshToken {
  refreshToken: string
}

interface RefreshTokenPayload {
  userId: string
  refreshTokenId: string
  isRefreshToken: true
}

async function createRefreshToken(
  db: Kysely<Database>,
  userId: string
): Promise<RefreshToken> {
  const { refresh_token_id } = await refreshTokenRepository.insertRefreshToken(
    db,
    userId
  )

  return signRefreshToken({
    userId,
    refreshTokenId: refresh_token_id,
    isRefreshToken: true,
  })
}

function signRefreshToken(tokenPayload: RefreshTokenPayload): RefreshToken {
  // Refresh tokens never expire.
  return { refreshToken: jwt.sign(tokenPayload, config.authTokenSecret) }
}

function createAuthToken(refreshToken: RefreshToken): AuthToken {
  const { userId, refreshTokenId } = verifyRefreshToken(refreshToken)
  return signAuthToken({ userId, refreshTokenId })
}

function verifyRefreshToken(token: RefreshToken): RefreshTokenPayload {
  const payload = verifyToken(token.refreshToken)

  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.userId !== 'string' ||
    typeof payload.refreshTokenId !== 'string' ||
    payload.isRefreshToken !== true
  ) {
    throw new InvalidAuthTokenError()
  }

  return {
    userId: payload.userId,
    refreshTokenId: payload.refreshTokenId,
    isRefreshToken: true,
  }
}

function signAuthToken(tokenPayload: AuthTokenPayload): AuthToken {
  return {
    authToken: jwt.sign(tokenPayload, config.authTokenSecret, {
      expiresIn: config.authTokenExpiryDuration,
    }),
  }
}

function verifyAuthToken(token: AuthToken): AuthTokenPayload {
  const payload = verifyToken(token.authToken)

  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.userId !== 'string' ||
    typeof payload.refreshTokenId !== 'string'
  ) {
    throw new InvalidAuthTokenError()
  }

  return {
    userId: payload.userId,
    refreshTokenId: payload.refreshTokenId,
  }
}

function verifyToken(token: string): string | jwt.JwtPayload {
  try {
    return jwt.verify(token, config.authTokenSecret)
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthTokenExpiredError()
    }

    throw new InvalidAuthTokenError()
  }
}

export const authTokenService = Object.freeze({
  createRefreshToken,
  createAuthToken,
  verifyAuthToken,
})
