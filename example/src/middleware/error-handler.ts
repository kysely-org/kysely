import type { MiddlewareHandler } from 'hono'
import { AppError } from '../util/errors.js'

export const errorHandler: MiddlewareHandler = async (c, next) => {
  try {
    await next()
  } catch (err) {
    if (err instanceof AppError) {
      return c.json({ error: err.code, message: err.message }, err.status)
    }
    console.error(err)
    return c.json({ error: 'InternalError', message: 'unexpected error' }, 500)
  }
}
