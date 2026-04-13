import { Hono } from 'hono'
import { z } from 'zod'
import type { Kysely } from 'kysely'
import type { Database } from '../database.js'
import { orderRepo } from '../repositories/order.repository.js'
import { AppError } from '../util/errors.js'

const CreateOrder = z.object({
  customer_id: z.number().int().positive(),
  lines: z.array(
    z.object({
      product_id: z.number().int().positive(),
      quantity: z.number().int().positive(),
      unit_price: z.number().positive(),
    }),
  ),
})

export function orderRoutes(db: Kysely<Database>) {
  const repo = orderRepo(db)
  const app = new Hono()

  app.get('/', async (c) => {
    const orders = await repo.findAll()
    return c.json(orders)
  })

  app.get('/:id', async (c) => {
    const id = Number(c.req.param('id'))
    const order = await repo.findById(id)
    return c.json(order)
  })

  app.post('/', async (c) => {
    const body = await c.req.json()
    const parsed = CreateOrder.safeParse(body)
    if (!parsed.success) {
      throw new AppError(400, 'ValidationError', parsed.error.message)
    }
    const { customer_id, lines } = parsed.data
    const order = await repo.create({ customer_id }, lines)
    return c.json(order, 201)
  })

  return app
}
