import type { MiddlewareHandler } from 'hono'
import * as jose from 'jose'
import { config } from '../config.js'
import { AppError } from '../util/errors.js'

const secret = new TextEncoder().encode(config.authSecret)

export interface AuthPayload {
  sub: string
}

export async function signToken(subject: string): Promise<string> {
  return new jose.SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(subject)
    .setExpirationTime('2h')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<AuthPayload> {
  const { payload } = await jose.jwtVerify(token, secret)
  return { sub: payload.sub! }
}

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const header = c.req.header('authorization')
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'Unauthorized', 'missing or invalid authorization header')
  }

  try {
    const payload = await verifyToken(header.slice(7))
    c.set('auth', payload)
  } catch {
    throw new AppError(401, 'Unauthorized', 'invalid or expired token')
  }

  await next()
}
