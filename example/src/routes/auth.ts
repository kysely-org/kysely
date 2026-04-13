import { Hono } from 'hono'
import { z } from 'zod'
import type { Kysely } from 'kysely'
import type { Database } from '../database.js'
import { signToken } from '../middleware/auth.js'
import { AppError } from '../util/errors.js'

const LoginBody = z.object({
  email: z.string().email(),
})

export function authRoutes(db: Kysely<Database>) {
  const app = new Hono()

  app.post('/login', async (c) => {
    const body = await c.req.json()
    const parsed = LoginBody.safeParse(body)
    if (!parsed.success) {
      throw new AppError(400, 'ValidationError', parsed.error.message)
    }

    const customer = await db
      .selectFrom('customer')
      .selectAll()
      .where('email', '=', parsed.data.email)
      .executeTakeFirst()

    if (!customer) {
      throw new AppError(401, 'Unauthorized', 'unknown email')
    }

    const token = await signToken(String(customer.id))
    return c.json({ token })
  })

  return app
}
