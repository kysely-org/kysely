import type { Generated, Insertable, Selectable, Updateable } from 'kysely'

export interface Database {
  customer: CustomerTable
  product: ProductTable
  order: OrderTable
  order_line: OrderLineTable
}

export interface CustomerTable {
  id: Generated<number>
  name: string
  email: string
  city: string | null
  created_at: Generated<Date>
}

export type Customer = Selectable<CustomerTable>
export type NewCustomer = Insertable<CustomerTable>
export type CustomerUpdate = Updateable<CustomerTable>

export interface ProductTable {
  id: Generated<number>
  name: string
  unit_price: number
  units_in_stock: number
  discontinued: Generated<boolean>
}

export type Product = Selectable<ProductTable>
export type NewProduct = Insertable<ProductTable>
export type ProductUpdate = Updateable<ProductTable>

export interface OrderTable {
  id: Generated<number>
  customer_id: number
  order_date: Generated<Date>
  shipped_date: Date | null
}

export type Order = Selectable<OrderTable>
export type NewOrder = Insertable<OrderTable>

export interface OrderLineTable {
  id: Generated<number>
  order_id: number
  product_id: number
  quantity: number
  unit_price: number
}

export type OrderLine = Selectable<OrderLineTable>
export type NewOrderLine = Insertable<OrderLineTable>
