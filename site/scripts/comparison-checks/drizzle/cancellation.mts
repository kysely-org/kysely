import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import {
  Kysely,
  PGliteDialect,
  type DatabaseConnection,
  type Dialect,
  type Driver,
} from 'kysely'
import { drizzle } from 'drizzle-stable/pglite'
import { integer, pgTable } from 'drizzle-stable/pg-core'
import type { PgTransactionConfig } from 'drizzle-stable/pg-core'
import { drizzle as rcDrizzle } from 'drizzle-rc/pglite'
import { integer as rcInteger, pgTable as rcTable } from 'drizzle-rc/pg-core'
import type { PgTransactionConfig as RcPgTransactionConfig } from 'drizzle-rc/pg-core'

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false

const pglite = new PGlite()
const pgliteDialect = new PGliteDialect({ pglite })
// PGlite runs on this thread, so a slow statement would block the timer that
// aborts it. A driver that answers after a delay stands in for a slow server.
const slowDialect: Dialect = {
  ...pgliteDialect,
  createAdapter: () => pgliteDialect.createAdapter(),
  createQueryCompiler: () => pgliteDialect.createQueryCompiler(),
  createIntrospector: (db) => pgliteDialect.createIntrospector(db),
  createDriver(): Driver {
    const driver = pgliteDialect.createDriver()
    return {
      ...driver,
      init: () => driver.init(),
      beginTransaction: (c, s) => driver.beginTransaction(c, s),
      commitTransaction: (c) => driver.commitTransaction(c),
      rollbackTransaction: (c) => driver.rollbackTransaction(c),
      releaseConnection: (c) => driver.releaseConnection(c),
      destroy: () => driver.destroy(),
      async acquireConnection(): Promise<DatabaseConnection> {
        const connection = await driver.acquireConnection()
        return {
          streamQuery: (q, c) => connection.streamQuery(q, c),
          async executeQuery(query) {
            await new Promise((resolve) => setTimeout(resolve, 500))
            return connection.executeQuery(query)
          },
        }
      },
    }
  },
}
const db = new Kysely<{ person: { id: number } }>({ dialect: slowDialect })
const person = pgTable('person', { id: integer().notNull() })
const rcPerson = rcTable('person', { id: rcInteger().notNull() })
const drizzleDb = drizzle(pglite),
  rcDb = rcDrizzle({ client: pglite })

try {
  await pglite.exec('create table person(id integer);insert into person values(1)')

  // Kysely: a signal on execute, stream, and a controlled connection.
  const gone = new Error('gone')
  await assert.rejects(
    db.selectFrom('person').selectAll().execute({ signal: AbortSignal.abort(gone) }),
    gone,
  )
  await assert.rejects(
    db.connection().execute(async (conn) => conn.selectFrom('person').selectAll().execute(), {
      signal: AbortSignal.abort(gone),
    }),
    gone,
  )
  await assert.rejects(
    (async () => {
      for await (const _ of db
        .selectFrom('person')
        .selectAll()
        .stream({ signal: AbortSignal.abort(gone) })) {
      }
    })(),
    gone,
  )
  const started = Date.now()
  await assert.rejects(
    db
      .selectFrom('person')
      .selectAll()
      .execute({ signal: AbortSignal.timeout(100) }),
    (error: unknown) => error instanceof Error && error.name === 'TimeoutError',
  )
  assert.ok(Date.now() - started < 400, 'the caller stops waiting on abort')
  assert.deepEqual(await db.selectFrom('person').selectAll().execute(), [{ id: 1 }])

  // Drizzle: execute() takes placeholder values; transactions take isolation options. No signal.
  const stable = drizzleDb.select({ id: person.id }).from(person)
  const rc = rcDb.select({ id: rcPerson.id }).from(rcPerson)
  const stableExecuteTakesPlaceholders: Equal<
    Parameters<typeof stable.execute>[0],
    Record<string, unknown> | undefined
  > = true
  const rcExecuteTakesPlaceholders: Equal<
    Parameters<typeof rc.execute>[0],
    Record<string, unknown> | undefined
  > = true
  const stableTransactionHasNoSignal: 'signal' extends keyof PgTransactionConfig ? false : true = true
  const rcTransactionHasNoSignal: 'signal' extends keyof RcPgTransactionConfig ? false : true = true
  assert.ok(
    stableExecuteTakesPlaceholders &&
      rcExecuteTakesPlaceholders &&
      stableTransactionHasNoSignal &&
      rcTransactionHasNoSignal,
  )
  assert.deepEqual(await stable.execute(), [{ id: 1 }])
  assert.deepEqual(await rc.execute(), [{ id: 1 }])
  console.log('PASS: cancellation')
} finally {
  await db.destroy()
}
