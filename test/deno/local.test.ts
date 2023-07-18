import {
  Generated,
  Kysely,
  PostgresDialect,
  MysqlDialect,
  sql,
} from '../../dist/esm/index.js'
import { createPool } from 'mysql2'
import Pool from 'pg-pool'

interface Person {
  id: Generated<number>
  first_name: string
  last_name: string | null
}

interface Database {
  person: Person
}

const dbs = [
  new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        database: 'kysely_test',
        host: 'localhost',
        user: 'kysely',
        port: 5434,
      }),
    }),
  }),
  new Kysely<Database>({
    dialect: new MysqlDialect({
      pool: createPool({
        database: 'kysely_test',
        host: 'localhost',
        user: 'kysely',
        password: 'kysely',
        port: 3308,
      }),
    }),
  }),
]

if (
  dbs
    .map((db) => db.selectFrom('person').select('id').compile().sql)
    .some((sql) => sql.match(/^select ["`]id["`] from ["`]person["`]$/) == null)
) {
  console.error('CDN deno test failed')
  Deno.exit(1)
}

const query = sql`select 1`

await Promise.all(dbs.map((db) => query.execute(db)))

console.error('local deno test passed')

await Promise.all(dbs.map((db) => db.closeConnection()))
