import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { Kysely, PGliteDialect, type Transaction } from 'kysely'
import { sql } from 'drizzle-stable'
import { integer, pgTable, text } from 'drizzle-stable/pg-core'
import { drizzle } from 'drizzle-stable/pglite'
import { sql as rcSql } from 'drizzle-rc'
import {
  integer as rcInteger,
  pgTable as rcTable,
  text as rcText,
} from 'drizzle-rc/pg-core'
import { drizzle as rcDrizzle } from 'drizzle-rc/pglite'

interface Database {
  person: { id: number; first_name: string }
}
const person = pgTable('person', {
  id: integer().notNull(),
  first_name: text().notNull(),
})
const rcPerson = rcTable('person', {
  id: rcInteger().notNull(),
  first_name: rcText().notNull(),
})

const pglite = new PGlite()
const db = new Kysely<Database>({ dialect: new PGliteDialect({ pglite }) })
const drizzleDb = drizzle(pglite)
const rcDb = rcDrizzle({ client: pglite })

await pglite.exec(`
  create table person (id integer primary key, first_name text not null);
  insert into person values (1, 'Jennifer');
`)

// A helper typed with the application's handle takes a transaction too.
// Kysely: Transaction<DB> extends Kysely<DB>.
async function kyselyFirstName(handle: Kysely<Database>) {
  const row = await handle
    .selectFrom('person')
    .select('first_name')
    .where('id', '=', 1)
    .executeTakeFirstOrThrow()
  return row.first_name
}
const viaTransaction = await db
  .transaction()
  .execute((trx: Transaction<Database>) => kyselyFirstName(trx))
assert.equal(viaTransaction, 'Jennifer')

// Drizzle: drizzle() returns the database type with a $client property that
// the transaction type lacks (drizzle-orm #3175, closed "not a bug").
async function drizzleFirstName(handle: typeof drizzleDb) {
  const [row] = await handle
    .select({ first_name: person.first_name })
    .from(person)
  return row!.first_name
}
async function rcFirstName(handle: typeof rcDb) {
  const [row] = await handle
    .select({ first_name: rcPerson.first_name })
    .from(rcPerson)
  return row!.first_name
}
function compileChecks() {
  drizzleDb.transaction(async (tx) => {
    // @ts-expect-error Property '$client' is missing in the transaction type.
    await drizzleFirstName(tx)
  })
  rcDb.transaction(async (tx) => {
    // @ts-expect-error Property '$client' is missing in the transaction type.
    await rcFirstName(tx)
  })
}
void compileChecks
assert.equal('$client' in drizzleDb, true)
assert.equal('$client' in rcDb, true)

// The workaround from #3175: omit $client from the parameter type.
async function drizzleFirstNameEither(
  handle: Omit<typeof drizzleDb, '$client'>,
) {
  const [row] = await handle
    .select({ first_name: person.first_name })
    .from(person)
  return row!.first_name
}
assert.equal(await drizzleFirstNameEither(drizzleDb), 'Jennifer')
assert.equal(
  await drizzleDb.transaction((tx) => drizzleFirstNameEither(tx)),
  'Jennifer',
)
async function rcFirstNameEither(handle: Omit<typeof rcDb, '$client'>) {
  const [row] = await handle
    .select({ first_name: rcPerson.first_name })
    .from(rcPerson)
  return row!.first_name
}
assert.equal(await rcDb.transaction((tx) => rcFirstNameEither(tx)), 'Jennifer')

// Upsert: excluded is a checked reference in Kysely and a raw string in
// Drizzle's upsert guide (drizzle-orm #1728 asks for a typed form).
const kyselyUpsert = db
  .insertInto('person')
  .values({ id: 1, first_name: 'Jen' })
  .onConflict((oc) =>
    oc
      .column('id')
      .doUpdateSet((eb) => ({ first_name: eb.ref('excluded.first_name') })),
  )
assert.equal(
  kyselyUpsert.compile().sql,
  'insert into "person" ("id", "first_name") values ($1, $2) on conflict ("id") do update set "first_name" = "excluded"."first_name"',
)
await kyselyUpsert.execute()
assert.equal(await kyselyFirstName(db), 'Jen')

function upsertCompileChecks() {
  db.insertInto('person')
    .values({ id: 1, first_name: 'Jen' })
    .onConflict((oc) =>
      oc
        .column('id')
        // @ts-expect-error excluded.frist_name is not a column of person.
        .doUpdateSet((eb) => ({ first_name: eb.ref('excluded.frist_name') })),
    )
}
void upsertCompileChecks

const drizzleUpsert = drizzleDb
  .insert(person)
  .values({ id: 1, first_name: 'Jennifer' })
  .onConflictDoUpdate({
    target: person.id,
    set: { first_name: sql.raw(`excluded.${person.first_name.name}`) },
  })
assert.equal(
  drizzleUpsert.toSQL().sql,
  'insert into "person" ("id", "first_name") values ($1, $2) on conflict ("id") do update set "first_name" = excluded.first_name',
)
await drizzleUpsert
assert.equal(await kyselyFirstName(db), 'Jennifer')

// A misspelled excluded reference compiles in both Drizzle versions.
const drizzleTypo = drizzleDb
  .insert(person)
  .values({ id: 1, first_name: 'Jen' })
  .onConflictDoUpdate({
    target: person.id,
    set: { first_name: sql.raw('excluded.frist_name') },
  })
await assert.rejects(drizzleTypo, /excluded\.frist_name/)
const rcTypo = rcDb
  .insert(rcPerson)
  .values({ id: 1, first_name: 'Jen' })
  .onConflictDoUpdate({
    target: rcPerson.id,
    set: { first_name: rcSql.raw('excluded.frist_name') },
  })
await assert.rejects(rcTypo, /excluded\.frist_name/)

console.log(
  'PASS: a Kysely<DB> parameter takes a Transaction<DB>; Drizzle stable/RC reject tx for typeof db ($client) and accept Omit<typeof db, "$client">; excluded is checked in Kysely and raw text in Drizzle',
)
