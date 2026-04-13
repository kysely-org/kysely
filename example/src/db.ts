import { Kysely, PostgresDialect } from 'kysely'
import pg from 'pg'
import type { Database } from './database.js'
import { config } from './config.js'

export function createDb() {
  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new pg.Pool(config.database),
    }),
  })
}
