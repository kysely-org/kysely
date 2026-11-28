import assert from 'node:assert/strict'
import { Kysely, MysqlDialect } from 'kysely'
import { int, mysqlTable, text } from 'drizzle-stable/mysql-core'
import { drizzle } from 'drizzle-stable/mysql-proxy'
import {
  int as rcInt,
  mysqlTable as rcTable,
  text as rcText,
} from 'drizzle-rc/mysql-core'
import { drizzle as rcDrizzle } from 'drizzle-rc/mysql-proxy'

interface Database {
  pet: { id: number; name: string; owner_id: number }
}
const pet = mysqlTable('pet', {
  id: int().notNull(),
  name: text().notNull(),
  owner_id: int().notNull(),
})
const rcPet = rcTable('pet', {
  id: rcInt().notNull(),
  name: rcText().notNull(),
  owner_id: rcInt().notNull(),
})
const catto = { id: 1, name: 'Catto', owner_id: 1 }

// Nothing here connects: the checks are the types and the compiled SQL.
const db = new Kysely<Database>({
  dialect: new MysqlDialect({ pool: {} as never }),
})
const drizzleDb = drizzle(async () => ({ rows: [] }))
const rcDb = rcDrizzle(async () => ({ rows: [] }))

// Kysely's types are the same on every dialect, so RETURNING compiles on MySQL.
const kyselyReturning = db.insertInto('pet').values(catto).returning('id')
assert.equal(
  kyselyReturning.compile().sql,
  'insert into `pet` (`id`, `name`, `owner_id`) values (?, ?, ?) returning `id`',
)

// Drizzle's MySQL builder has no returning() to call.
function compileChecks() {
  // @ts-expect-error returning does not exist on the MySQL insert builder.
  drizzleDb.insert(pet).values(catto).returning()
  // @ts-expect-error returning does not exist on the MySQL insert builder.
  rcDb.insert(rcPet).values(catto).returning()
}
void compileChecks
assert.equal('returning' in drizzleDb.insert(pet).values(catto), false)
assert.equal('returning' in rcDb.insert(rcPet).values(catto), false)

console.log(
  'PASS: Kysely compiles RETURNING on a MySQL instance; Drizzle stable/RC MySQL insert builders have no returning() in types or at runtime',
)
