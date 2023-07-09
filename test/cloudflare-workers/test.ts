import { Pool } from 'pg'
import { Generated, Kysely, PostgresDialect, sql } from '../../dist/cjs'

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

;(async () => {
  await sql`select 1`.execute(db)

  process.exit(0)
})()
