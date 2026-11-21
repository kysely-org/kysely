import { drizzle } from 'drizzle-stable/node-postgres'
import { integer, pgTable, text } from 'drizzle-stable/pg-core'
import { Pool } from 'pg'

const person = pgTable('person', {
  id: integer().notNull(),
  first_name: text().notNull(),
  age: integer(),
})

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle({ client: pool })

export function listPeople() {
  return db.select().from(person)
}

export function close() {
  return pool.end()
}
