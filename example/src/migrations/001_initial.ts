import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('customer')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('city', 'varchar(255)')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  await db.schema
    .createTable('product')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('unit_price', 'decimal(10,2)', (col) => col.notNull())
    .addColumn('units_in_stock', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('discontinued', 'boolean', (col) => col.notNull().defaultTo(false))
    .execute()

  await db.schema
    .createTable('order')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('customer_id', 'integer', (col) =>
      col.notNull().references('customer.id').onDelete('cascade'),
    )
    .addColumn('order_date', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('shipped_date', 'timestamptz')
    .execute()

  await db.schema
    .createTable('order_line')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('order_id', 'integer', (col) =>
      col.notNull().references('order.id').onDelete('cascade'),
    )
    .addColumn('product_id', 'integer', (col) =>
      col.notNull().references('product.id').onDelete('restrict'),
    )
    .addColumn('quantity', 'integer', (col) => col.notNull())
    .addColumn('unit_price', 'decimal(10,2)', (col) => col.notNull())
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('order_line').execute()
  await db.schema.dropTable('order').execute()
  await db.schema.dropTable('product').execute()
  await db.schema.dropTable('customer').execute()
}
