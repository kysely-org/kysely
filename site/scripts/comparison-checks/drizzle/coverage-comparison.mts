import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { Kysely, PGliteDialect } from 'kysely'
import { sql, eq, desc } from 'drizzle-stable'
import {
  integer,
  pgTable,
  text,
  timestamp,
  QueryBuilder,
} from 'drizzle-stable/pg-core'
import { sql as rcSql, eq as rcEq, desc as rcDesc } from 'drizzle-rc'
import {
  integer as rcInteger,
  pgTable as rcTable,
  text as rcText,
  timestamp as rcTimestamp,
  QueryBuilder as RcBuilder,
} from 'drizzle-rc/pg-core'
interface Database {
  asset: { id: number; owner_id: number; kind: string }
  events_core: { span_id: string; trace_id: string; start_time: Date }
  person: { id: number }
}
const pglite = new PGlite()
const db = new Kysely<Database>({ dialect: new PGliteDialect({ pglite }) })
const asset = pgTable('asset', {
  id: integer().notNull(),
  ownerId: integer('owner_id').notNull(),
  kind: text().notNull(),
})
const events = pgTable('events_core', {
  spanId: text('span_id').notNull(),
  traceId: text('trace_id').notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
})
const drizzleDb = new QueryBuilder()
const imageCount = db
  .selectFrom('asset')
  .select((eb) =>
    eb.fn
      .countAll<string>()
      .filterWhere('kind', '=', 'image')
      .as('image_count'),
  )
const drizzleImageCount = drizzleDb
  .select({
    image_count:
      sql<string>`count(*) filter (where ${eq(asset.kind, 'image')})`.as(
        'image_count',
      ),
  })
  .from(asset)
const unusedWrongCount = drizzleDb
  .select({
    image_count: sql<string>`count(*) filter (where ${asset.kind} = ${42})`.as(
      'image_count',
    ),
  })
  .from(asset)
function compileChecks() {
  db.selectFrom('events_core').select((eb) =>
    eb.fn
      .agg<string>('rank')
      // @ts-expect-error person has not been joined to this query.
      .over((ob) => ob.partitionBy('person.id'))
      .as('rk'),
  )
  db.selectFrom('asset').select((eb) =>
    // @ts-expect-error kind is a string column.
    eb.fn.countAll<string>().filterWhere('kind', '=', 42).as('image_count'),
  )
}
void compileChecks
const ranked = db
  .selectFrom('events_core')
  .select('span_id')
  .select((eb) =>
    eb.fn
      .agg<string>('rank')
      .over((ob) => ob.partitionBy('trace_id').orderBy('start_time', 'desc'))
      .as('rk'),
  )
  .orderBy('span_id')
const drizzleRanked = drizzleDb
  .select({
    span_id: events.spanId,
    rk: sql<string>`rank() over (partition by ${events.traceId} order by ${desc(events.startTime)})`.as(
      'rk',
    ),
  })
  .from(events)
  .orderBy(events.spanId)
const rcAsset = rcTable('asset', {
  id: rcInteger().notNull(),
  kind: rcText().notNull(),
})
const rcEvents = rcTable('events_core', {
  spanId: rcText('span_id').notNull(),
  traceId: rcText('trace_id').notNull(),
  startTime: rcTimestamp('start_time', { withTimezone: true }).notNull(),
})
const rcDb = new RcBuilder()
const rcCount = rcDb
  .select({
    image_count:
      rcSql<string>`count(*) filter (where ${rcEq(rcAsset.kind, 'image')})`.as(
        'image_count',
      ),
  })
  .from(rcAsset)
const unusedRcWrong = rcDb
  .select({
    image_count:
      rcSql<string>`count(*) filter (where ${rcAsset.kind} = ${42})`.as(
        'image_count',
      ),
  })
  .from(rcAsset)
const rcRanked = rcDb
  .select({
    span_id: rcEvents.spanId,
    rk: rcSql<string>`rank() over (partition by ${rcEvents.traceId} order by ${rcDesc(rcEvents.startTime)})`.as(
      'rk',
    ),
  })
  .from(rcEvents)
  .orderBy(rcEvents.spanId)
async function run(q: { toSQL(): { sql: string; params: any[] } }) {
  const c = q.toSQL()
  return (await pglite.query(c.sql, c.params)).rows as Record<string, unknown>[]
}
const personTable = pgTable('person', { id: integer().notNull() })
const rcPerson = rcTable('person', { id: rcInteger().notNull() })
const invalidPartition = drizzleDb
  .select({
    rk: sql<string>`rank() over (partition by ${personTable.id} order by ${desc(events.startTime)})`.as(
      'rk',
    ),
  })
  .from(events)
const rcInvalidPartition = rcDb
  .select({
    rk: rcSql<string>`rank() over (partition by ${rcPerson.id} order by ${rcDesc(rcEvents.startTime)})`.as(
      'rk',
    ),
  })
  .from(rcEvents)
try {
  await pglite.exec(
    "create table asset(id integer,owner_id integer,kind text);insert into asset values(1,1,'image'),(2,1,'video'),(3,2,'image');create table events_core(span_id text,trace_id text,start_time timestamptz);insert into events_core values('a','t1','2026-01-01 00:00Z'),('b','t1','2026-01-01 01:00Z'),('c','t1','2026-01-01 01:00Z'),('d','t2','2026-01-01 00:00Z')",
  )
  assert.equal(
    String((await imageCount.executeTakeFirstOrThrow()).image_count),
    '2',
  )
  for (const q of [drizzleImageCount, rcCount])
    assert.equal(String((await run(q))[0].image_count), '2')

  const normalize = (rows: Record<string, unknown>[]) =>
    rows.map((r) => ({ span_id: r.span_id, rk: String(r.rk) }))
  const rows = normalize(await ranked.execute())
  assert.deepEqual(rows, [
    { span_id: 'a', rk: '3' },
    { span_id: 'b', rk: '1' },
    { span_id: 'c', rk: '1' },
    { span_id: 'd', rk: '1' },
  ])
  for (const q of [drizzleRanked, rcRanked])
    assert.deepEqual(normalize(await run(q)), rows)
  for (const [version, q] of [
    ['stable', invalidPartition],
    ['rc', rcInvalidPartition],
  ] as const) {
    await assert.rejects(
      run(q),
      /column "id" does not exist|missing FROM-clause entry for table "person"/,
    )
    console.log(version + ': ' + q.toSQL().sql)
  }
  console.log(
    'PASS: filtered counts and ranking with ties agree across Kysely and Drizzle stable/RC; an out-of-scope window partition passes Drizzle types and SQL generation but fails in PostgreSQL; Kysely rejects it',
  )
} finally {
  await db.destroy()
}
