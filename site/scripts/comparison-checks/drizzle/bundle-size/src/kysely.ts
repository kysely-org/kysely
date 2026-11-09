import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'

interface Database {
  person: { id: number; first_name: string; age: number | null }
}

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: process.env.DATABASE_URL }),
  }),
})

export function listPeople() {
  return db.selectFrom('person').selectAll().execute()
}

export function close() {
  return db.destroy()
}
