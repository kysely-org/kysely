import { Pool } from 'pg'
import { Hono } from 'hono'
import { Generated, Kysely, PostgresDialect, sql } from '../../'

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

const app = new Hono()

app.get('/', async (c) => {
  if (
    db.selectFrom('person').selectAll().compile().sql !==
    'select * from "person"'
  ) {
    throw new Error('Unexpected SQL')
  }

  const {
    rows: [row],
  } = await sql`select 1 as ok`.execute(db)

  return c.json(row as object)
})

export default app
