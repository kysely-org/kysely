import type { Kysely } from 'kysely'
import type {
  Customer,
  CustomerUpdate,
  Database,
  NewCustomer,
} from '../database.js'
import { AppError } from '../util/errors.js'

export function customerRepo(db: Kysely<Database>) {
  return {
    async findAll(): Promise<Customer[]> {
      return db.selectFrom('customer').selectAll().orderBy('id').execute()
    },

    async findById(id: number): Promise<Customer> {
      const row = await db
        .selectFrom('customer')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst()

      if (!row) {
        throw new AppError(404, 'NotFound', `customer ${id} not found`)
      }
      return row
    },

    async create(data: NewCustomer): Promise<Customer> {
      return db
        .insertInto('customer')
        .values(data)
        .returningAll()
        .executeTakeFirstOrThrow()
    },

    async update(id: number, data: CustomerUpdate): Promise<Customer> {
      const row = await db
        .updateTable('customer')
        .set(data)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst()

      if (!row) {
        throw new AppError(404, 'NotFound', `customer ${id} not found`)
      }
      return row
    },

    async delete(id: number): Promise<void> {
      const result = await db
        .deleteFrom('customer')
        .where('id', '=', id)
        .executeTakeFirst()

      if (result.numDeletedRows === 0n) {
        throw new AppError(404, 'NotFound', `customer ${id} not found`)
      }
    },
  }
}
