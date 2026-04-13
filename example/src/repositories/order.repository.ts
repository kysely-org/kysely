import type { Kysely } from 'kysely'
import type { Database, NewOrder, NewOrderLine, Order } from '../database.js'
import { AppError } from '../util/errors.js'

export interface OrderWithLines extends Order {
  lines: Array<{
    product_id: number
    product_name: string
    quantity: number
    unit_price: number
  }>
}

export function orderRepo(db: Kysely<Database>) {
  return {
    async findAll(): Promise<Order[]> {
      return db.selectFrom('order').selectAll().orderBy('id', 'desc').execute()
    },

    async findById(id: number): Promise<OrderWithLines> {
      const order = await db
        .selectFrom('order')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst()

      if (!order) {
        throw new AppError(404, 'NotFound', `order ${id} not found`)
      }

      const lines = await db
        .selectFrom('order_line')
        .innerJoin('product', 'product.id', 'order_line.product_id')
        .select([
          'order_line.product_id',
          'product.name as product_name',
          'order_line.quantity',
          'order_line.unit_price',
        ])
        .where('order_line.order_id', '=', id)
        .execute()

      return { ...order, lines }
    },

    async create(
      data: NewOrder,
      lines: Omit<NewOrderLine, 'order_id'>[],
    ): Promise<Order> {
      return db.transaction().execute(async (trx) => {
        const order = await trx
          .insertInto('order')
          .values(data)
          .returningAll()
          .executeTakeFirstOrThrow()

        if (lines.length > 0) {
          await trx
            .insertInto('order_line')
            .values(lines.map((l) => ({ ...l, order_id: order.id })))
            .execute()
        }

        return order
      })
    },
  }
}
