import { Hono } from 'hono'
import { z } from 'zod'
import type { Kysely } from 'kysely'
import type { Database } from '../database.js'
import { productRepo } from '../repositories/product.repository.js'
import { AppError } from '../util/errors.js'

const CreateProduct = z.object({
  name: z.string().min(1),
  unit_price: z.number().positive(),
  units_in_stock: z.number().int().nonnegative().optional(),
  discontinued: z.boolean().optional(),
})

const UpdateProduct = z.object({
  name: z.string().min(1).optional(),
  unit_price: z.number().positive().optional(),
  units_in_stock: z.number().int().nonnegative().optional(),
  discontinued: z.boolean().optional(),
})

export function productRoutes(db: Kysely<Database>) {
  const repo = productRepo(db)
  const app = new Hono()

  app.get('/', async (c) => {
    const products = await repo.findAll()
    return c.json(products)
  })

  app.get('/:id', async (c) => {
    const id = Number(c.req.param('id'))
    const product = await repo.findById(id)
    return c.json(product)
  })

  app.post('/', async (c) => {
    const body = await c.req.json()
    const parsed = CreateProduct.safeParse(body)
    if (!parsed.success) {
      throw new AppError(400, 'ValidationError', parsed.error.message)
    }
    const product = await repo.create(parsed.data)
    return c.json(product, 201)
  })

  app.patch('/:id', async (c) => {
    const id = Number(c.req.param('id'))
    const body = await c.req.json()
    const parsed = UpdateProduct.safeParse(body)
    if (!parsed.success) {
      throw new AppError(400, 'ValidationError', parsed.error.message)
    }
    const product = await repo.update(id, parsed.data)
    return c.json(product)
  })

  app.delete('/:id', async (c) => {
    const id = Number(c.req.param('id'))
    await repo.delete(id)
    return c.body(null, 204)
  })

  return app
}
