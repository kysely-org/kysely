import assert from 'node:assert/strict'
import knexFactory from 'knex'
import {
  Kysely,
  DummyDriver,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  sql,
  type SqlBool,
} from 'kysely'
const pg = knexFactory({ client: 'pg' })
const mysql = knexFactory({ client: 'mysql2' })
const sqlite = knexFactory({ client: 'sqlite3', useNullAsDefault: true })
const upsert = (knex: typeof pg) =>
  knex('person')
    .insert({ id: 1, first_name: 'Jennifer' })
    .onConflict('id')
    .merge(['first_name'])
const json = (knex: typeof pg) =>
  knex('person').jsonExtract('profile', '$.name', 'name')
const db = new Kysely<{ person: { id: number; first_name: string } }>({
  dialect: {
    createDriver: () => new DummyDriver(),
    createAdapter: () => new PostgresAdapter(),
    createQueryCompiler: () => new PostgresQueryCompiler(),
    createIntrospector: (db) => new PostgresIntrospector(db),
  },
})
const referenced = pg('person').select(pg.ref('id').as('person_id'))
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false
type Expect<T extends true> = T
type ReferenceInference = Expect<
  Equal<Awaited<typeof referenced>, { person_id: number }[]>
>
try {
  assert.match(
    upsert(pg).toSQL().sql,
    /on conflict \("id"\) do update set "first_name" = excluded\."first_name"/,
  )
  const my = upsert(mysql).toSQL().sql
  assert.match(
    my,
    /on duplicate key update `first_name` = values\(`first_name`\)/,
  )
  assert(!my.includes('on conflict'))
  assert.deepEqual(json(pg).toSQL().bindings, ['$.name'])
  assert.match(json(pg).toSQL().sql, /jsonb_path_query\("profile", \?\)/)
  assert.match(
    json(mysql).toSQL().sql,
    /json_unquote\(json_extract\(`profile`, \?\)\)/,
  )
  assert.match(json(sqlite).toSQL().sql, /json_extract\(`profile`, \?\)/)
  const raw = pg
    .raw('?? = ?', ['person.first_name', 'Jennifer'])
    .toSQL()
    .toNative()
  assert.deepEqual(raw, {
    sql: '"person"."first_name" = $1',
    bindings: ['Jennifer'],
  })
  const kyselyRaw = db
    .selectFrom('person')
    .select('id')
    .where((eb) => sql<SqlBool>`${eb.ref('person.first_name')} = ${'Jennifer'}`)
    .compile()
  assert.match(kyselyRaw.sql, /where "person"\."first_name" = \$1/)
  assert.deepEqual(kyselyRaw.parameters, ['Jennifer'])
  const window = pg('person')
    .select('id')
    .rank('rk', function () {
      this.partitionBy('id').orderBy('first_name', 'desc')
    })
    .toSQL()
  assert.match(
    window.sql,
    /rank\(\) over \(partition by "id" order by "first_name" desc\)/,
  )
  assert(!('filterWhere' in pg('person').count()))
  console.log(
    'PASS: Knex upsert conflict-target differences, JSON function compilation across three dialects, raw identifier/value bindings, built-in rank(), and basic knex.ref() inference.',
  )
} finally {
  await Promise.all([
    pg.destroy(),
    mysql.destroy(),
    sqlite.destroy(),
    db.destroy(),
  ])
}
