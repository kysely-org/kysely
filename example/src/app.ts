import { Hono } from 'hono'
import type { Kysely } from 'kysely'
import type { Database } from './database.js'
import { errorHandler } from './middleware/error-handler.js'
import { requireAuth } from './middleware/auth.js'
import { customerRoutes } from './routes/customers.js'
import { productRoutes } from './routes/products.js'
import { orderRoutes } from './routes/orders.js'
import { authRoutes } from './routes/auth.js'

export function createApp(db: Kysely<Database>) {
  const app = new Hono()

  app.use('*', errorHandler)

  app.route('/auth', authRoutes(db))

  app.use('/customers/*', requireAuth)
  app.use('/products/*', requireAuth)
  app.use('/orders/*', requireAuth)

  app.route('/customers', customerRoutes(db))
  app.route('/products', productRoutes(db))
  app.route('/orders', orderRoutes(db))

  app.get('/health', (c) => c.json({ status: 'ok' }))

  return app
}
