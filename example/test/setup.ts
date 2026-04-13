import { Kysely, PostgresDialect, sql } from 'kysely'
import pg from 'pg'
import type { Database } from '../src/database.js'

const TEST_DB = 'northwind_test'

export async function createTestDb(): Promise<Kysely<Database>> {
  const adminPool = new pg.Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  })

  const client = await adminPool.connect()
  await client.query(`DROP DATABASE IF EXISTS ${TEST_DB}`)
  await client.query(`CREATE DATABASE ${TEST_DB}`)
  client.release()
  await adminPool.end()

  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'postgres',
        database: TEST_DB,
      }),
    }),
  })

  const { up } = await import('../src/migrations/001_initial.js')
  await up(db)

  return db
}
