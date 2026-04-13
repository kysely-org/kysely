import type { Kysely } from 'kysely'
import type {
  Database,
  NewProduct,
  Product,
  ProductUpdate,
} from '../database.js'
import { AppError } from '../util/errors.js'

export function productRepo(db: Kysely<Database>) {
  return {
    async findAll(): Promise<Product[]> {
      return db.selectFrom('product').selectAll().orderBy('id').execute()
    },

    async findById(id: number): Promise<Product> {
      const row = await db
        .selectFrom('product')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst()

      if (!row) {
        throw new AppError(404, 'NotFound', `product ${id} not found`)
      }
      return row
    },

    async create(data: NewProduct): Promise<Product> {
      return db
        .insertInto('product')
        .values(data)
        .returningAll()
        .executeTakeFirstOrThrow()
    },

    async update(id: number, data: ProductUpdate): Promise<Product> {
      const row = await db
        .updateTable('product')
        .set(data)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst()

      if (!row) {
        throw new AppError(404, 'NotFound', `product ${id} not found`)
      }
      return row
    },

    async delete(id: number): Promise<void> {
      const result = await db
        .deleteFrom('product')
        .where('id', '=', id)
        .executeTakeFirst()

      if (result.numDeletedRows === 0n) {
        throw new AppError(404, 'NotFound', `product ${id} not found`)
      }
    },
  }
}
