import { createPool } from 'mysql2'
import { Pool } from 'pg'
import { Hono } from 'hono'
import { Generated, Kysely, MysqlDialect, PostgresDialect, sql } from '../..'

interface Person {
  id: Generated<number>
  first_name: string
  last_name: string | null
}

interface Database {
  person: Person
}

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      database: 'kysely_test',
      host: 'localhost',
      user: 'kysely',
      port: 5434,
    }),
  }),
})

if (
  db
    .selectFrom('person')
    .select('id')
    .compile()
    .sql.match(/^select "id" from "person"$/) === null
) {
  console.error('cloudflare workers test failed')
  process.exit(1)
}

const app = new Hono()

const query = sql`select 1`

app.get('/pg', async (c) => {
  const {
    rows: [row],
  } = await query.execute(db)

  return c.json(row)
})

export default app
