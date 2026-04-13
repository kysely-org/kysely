import { Hono } from 'hono'
import { z } from 'zod'
import type { Kysely } from 'kysely'
import type { Database } from '../database.js'
import { customerRepo } from '../repositories/customer.repository.js'
import { AppError } from '../util/errors.js'

const CreateCustomer = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  city: z.string().nullable().optional(),
})

const UpdateCustomer = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  city: z.string().nullable().optional(),
})

export function customerRoutes(db: Kysely<Database>) {
  const repo = customerRepo(db)
  const app = new Hono()

  app.get('/', async (c) => {
    const customers = await repo.findAll()
    return c.json(customers)
  })

  app.get('/:id', async (c) => {
    const id = Number(c.req.param('id'))
    const customer = await repo.findById(id)
    return c.json(customer)
  })

  app.post('/', async (c) => {
    const body = await c.req.json()
    const parsed = CreateCustomer.safeParse(body)
    if (!parsed.success) {
      throw new AppError(400, 'ValidationError', parsed.error.message)
    }
    const customer = await repo.create(parsed.data)
    return c.json(customer, 201)
  })

  app.patch('/:id', async (c) => {
    const id = Number(c.req.param('id'))
    const body = await c.req.json()
    const parsed = UpdateCustomer.safeParse(body)
    if (!parsed.success) {
      throw new AppError(400, 'ValidationError', parsed.error.message)
    }
    const customer = await repo.update(id, parsed.data)
    return c.json(customer)
  })

  app.delete('/:id', async (c) => {
    const id = Number(c.req.param('id'))
    await repo.delete(id)
    return c.body(null, 204)
  })

  return app
}
